import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type UserStatus = 'idle' | 'busy' | 'in-race';

export interface GCUser {
    id: string;
    name: string;
    status: UserStatus;
    joinedAt: number;
    ip?: string;
    isAdmin?: boolean;
}

export interface GCMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    type: 'chat' | 'system' | 'challenge';
    isAdmin?: boolean;
}

export interface ChallengeInvite {
    from: string;
    fromName: string;
    roomCode: string;
    timestamp: number;
}

interface GCPresence {
    name: string;
    status: UserStatus;
    joinedAt: number;
    ip?: string;
    isAdmin?: boolean;
}

const GC_CHANNEL = 'public-gc-lobby';
const PAGE_SIZE = 100;
const MESSAGE_COOLDOWN_MS = 1500;
const createMessageId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const getStoredUserId = () => {
    if (typeof window === 'undefined') return '';
    const saved = localStorage.getItem('kf_gc_user_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 10);
    localStorage.setItem('kf_gc_user_id', newId);
    return newId;
};

const getStoredAdminStatus = () => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('kf_gc_admin_secret');
    const actual = import.meta.env.VITE_ADMIN_SECRET;
    return !!(actual && stored === actual);
};

export const useGCLobby = (playerName: string | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<GCUser[]>([]);
    const [messages, setMessages] = useState<GCMessage[]>([]);
    const [pendingChallenge, setPendingChallenge] = useState<ChallengeInvite | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [challengeAccepted, setChallengeAccepted] = useState<{ roomCode: string; byName: string } | null>(null);
    const [challengeDeclined, setChallengeDeclined] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(getStoredAdminStatus());
    const [totalMessages, setTotalMessages] = useState(0);

    const [hasMore, setHasMore] = useState(true);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const myId = useRef<string>(getStoredUserId());
    const lastMessageTime = useRef<number>(0);
    const suppressCleanupRef = useRef(false);
    const loadedFromDB = useRef<Set<string>>(new Set());
    const oldestTimestampRef = useRef<string | null>(null);

    // Save chat message to DB (fire and forget)
    const saveMessageToDB = useCallback(async (msg: GCMessage) => {
        try {
            await supabase.from('gc_messages').insert({
                id: msg.id,
                sender_id: msg.senderId,
                sender_name: msg.senderName,
                text: msg.text,
            });
        } catch (e) {
            console.warn('GC message save failed:', e);
        }
    }, []);


    // saveToDb=true only for challenge-related system messages worth keeping in history
    const addSystemMessage = useCallback(async (text: string, saveToDb = false, id?: string) => {
        const msgId = id || createMessageId();
        const msg: GCMessage = {
            id: msgId,
            senderId: 'system',
            senderName: 'System',
            text,
            timestamp: Date.now(),
            type: 'system',
        };
        setMessages(prev => {
            if (prev.some(m => m.id === msgId)) return prev;
            setTotalMessages(t => t + 1);
            return [...prev, msg];
        });
        if (saveToDb) {
            await saveMessageToDB(msg);
        }
    }, [saveMessageToDB]);

    // Fetch absolute total count from DB
    const fetchTotalCount = useCallback(async () => {
        try {
            const { count } = await supabase
                .from('gc_messages')
                .select('*', { count: 'exact', head: true });
            if (count !== null) setTotalMessages(count);
        } catch (e) {
            console.warn('GC count fetch failed:', e);
        }
    }, []);

    // Load messages from Supabase DB with pagination
    const loadHistory = useCallback(async (beforeTimestamp?: string) => {
        if (!hasMore && beforeTimestamp) return;
        setIsLoadingHistory(true);
        try {
            let query = supabase
                .from('gc_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(PAGE_SIZE);

            if (beforeTimestamp) {
                query = query.lt('created_at', beforeTimestamp);
            }

            const { data, error: dbError } = await query;

            if (dbError) {
                console.warn('GC history load failed:', dbError.message);
                return;
            }

            if (data && data.length > 0) {
                const historyMessages: GCMessage[] = data.map(row => ({
                    id: row.id,
                    senderId: row.sender_id,
                    senderName: row.sender_name,
                    text: row.text,
                    timestamp: new Date(row.created_at).getTime(),
                    type: row.sender_id === 'system' ? 'system' as const : 'chat' as const,
                })).reverse();

                historyMessages.forEach(m => loadedFromDB.current.add(m.id));

                // Track oldest timestamp for next page
                const oldest = data[data.length - 1].created_at;
                if (!oldestTimestampRef.current || oldest < oldestTimestampRef.current) {
                    oldestTimestampRef.current = oldest;
                }

                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                }

                setMessages(prev => {
                    const combined = [...historyMessages, ...prev];

                    const seen = new Set<string>();
                    const unique = combined.filter(m => {
                        if (seen.has(m.id)) return false;
                        seen.add(m.id);
                        return true;
                    });

                    return unique;
                });
            } else {
                setHasMore(false);
            }
        } catch (e) {
            console.warn('GC history load error:', e);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [hasMore]);

    const loadMoreHistory = useCallback(async () => {
        if (isLoadingHistory || !hasMore || !oldestTimestampRef.current) return;
        await loadHistory(oldestTimestampRef.current);
    }, [isLoadingHistory, hasMore, loadHistory]);


    const join = useCallback(async () => {
        if (!playerName || channelRef.current) return;
        suppressCleanupRef.current = false;
        setError(null);

        await loadHistory();
        await fetchTotalCount();

        let myIp = 'unknown';
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            myIp = data.ip;
        } catch (e) { console.warn('IP fetch failed', e); }

        const channel = supabase.channel(GC_CHANNEL, {
            config: {
                presence: { key: myId.current },
                broadcast: { self: false },
            },
        });

        channelRef.current = channel;

        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState<GCPresence>();
            const users = Object.entries(state)
                .map(([id, presences]) => {
                    const presence = presences[0];
                    if (!presence) return null;
                    return {
                        id,
                        name: presence.name,
                        status: presence.status,
                        joinedAt: presence.joinedAt,
                        ip: presence.ip,
                        isAdmin: presence.isAdmin,
                    } as GCUser;
                })
                .filter((user): user is GCUser => user !== null);
            setOnlineUsers(users);
        });

        channel.on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: GCPresence[] }) => {
            const presence = newPresences[0];
            if (key !== myId.current && presence?.name) {
                // Only show joined message if they weren't already in the presence state
                const currentState = channel.presenceState<GCPresence>();
                const alreadyPresent = Object.keys(currentState).filter(k => k !== key).length > 0
                    ? key in currentState && (currentState[key]?.length ?? 0) > 1
                    : false;
                if (!alreadyPresent) {
                    addSystemMessage(`${presence.name} joined the lobby`);
                }
            }
        });

        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: GCPresence[] }) => {
            const presence = leftPresences[0];
            if (key !== myId.current && presence?.name) {
                // Only show left message if they are fully gone from presence state
                const currentState = channel.presenceState<GCPresence>();
                const stillPresent = key in currentState && (currentState[key]?.length ?? 0) > 0;
                if (!stillPresent) {
                    addSystemMessage(`${presence.name} left the lobby`);
                }
            }
        });

        channel.on('broadcast', { event: 'gc' }, ({ payload }) => {
            if (payload.senderId === myId.current) return;

            if (payload.type === 'chat') {
                if (loadedFromDB.current.has(payload.id)) return;
                const msg: GCMessage = {
                    id: payload.id,
                    senderId: payload.senderId,
                    senderName: payload.senderName,
                    text: payload.text,
                    timestamp: payload.timestamp,
                    type: 'chat',
                    isAdmin: payload.isAdmin,
                };
                setMessages(prev => {
                    setTotalMessages(t => t + 1);
                    return [...prev, msg];
                });
            }

            if (payload.type === 'challenge') {
                const msgId = payload.msgId || payload.id;
                if (loadedFromDB.current.has(msgId)) return;

                // Show challenge message to everyone
                if (payload.text) {
                    const msg: GCMessage = {
                        id: msgId,
                        senderId: 'system',
                        senderName: 'System',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'system',
                    };
                    setMessages(prev => {
                        setTotalMessages(t => t + 1);
                        return [...prev, msg];
                    });
                }

                if (payload.to === myId.current) {
                    setPendingChallenge({
                        from: payload.senderId,
                        fromName: payload.fromName,
                        roomCode: payload.roomCode,
                        timestamp: Date.now(),
                    });
                }
            }

            if (payload.type === 'challenge-accepted') {
                const msgId = payload.msgId || payload.id;
                if (loadedFromDB.current.has(msgId)) return;

                // Show accept message to everyone
                if (payload.text) {
                    const msg: GCMessage = {
                        id: msgId,
                        senderId: 'system',
                        senderName: 'System',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'system',
                    };
                    setMessages(prev => {
                        setTotalMessages(t => t + 1);
                        return [...prev, msg];
                    });
                }

                if (payload.to === myId.current) {
                    setChallengeAccepted({ roomCode: payload.roomCode, byName: payload.fromName });
                }
            }

            if (payload.type === 'challenge-cancelled') {
                const msgId = payload.msgId || payload.id;
                if (loadedFromDB.current.has(msgId)) return;

                // Show cancellation message to everyone in chat
                if (payload.text) {
                    const msg: GCMessage = {
                        id: msgId,
                        senderId: 'system',
                        senderName: 'System',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'system',
                    };
                    setMessages(prev => {
                        setTotalMessages(t => t + 1);
                        return [...prev, msg];
                    });
                }
                // Clear the pending challenge on the receiver side
                if (payload.to === myId.current) {
                    setPendingChallenge(null);
                }
            }

            if (payload.type === 'challenge-declined') {
                const msgId = payload.msgId || payload.id;
                if (loadedFromDB.current.has(msgId)) return;

                // Show decline message to everyone
                if (payload.text) {
                    const msg: GCMessage = {
                        id: msgId,
                        senderId: 'system',
                        senderName: 'System',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'system',
                    };
                    setMessages(prev => {
                        setTotalMessages(t => t + 1);
                        return [...prev, msg];
                    });
                }

                if (payload.to === myId.current) {
                    setChallengeAccepted(null);
                    setChallengeDeclined(payload.fromName);
                }
            }

            if (payload.type === 'message-deleted') {
                setMessages(prev => prev.map(m =>
                    m.id === payload.msgId
                        ? { ...m, text: 'This message is deleted by Admin' }
                        : m
                ));
            }
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    name: playerName,
                    status: 'idle' as UserStatus,
                    joinedAt: Date.now(),
                    ip: myIp,
                    isAdmin,
                });
                setIsConnected(true);
                addSystemMessage('You joined the public lobby');
            } else if (status === 'CHANNEL_ERROR') {
                setError('Failed to connect to lobby');
                setIsConnected(false);
            }
        });
    }, [playerName, addSystemMessage, loadHistory, isAdmin]);

    const leave = useCallback(() => {
        suppressCleanupRef.current = true;
        if (channelRef.current) {
            channelRef.current.untrack();
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }
        setIsConnected(false);
        setOnlineUsers([]);
        setMessages([]);
        setPendingChallenge(null);
        setChallengeAccepted(null);
        setChallengeDeclined(null);
        loadedFromDB.current.clear();
        oldestTimestampRef.current = null;
        setHasMore(true);
    }, []);

    const leaveSilently = useCallback(() => {
        suppressCleanupRef.current = true;
        setIsConnected(false);
        setOnlineUsers([]);
        setPendingChallenge(null);
        setChallengeAccepted(null);
        setChallengeDeclined(null);
        loadedFromDB.current.clear();
        setTimeout(() => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        }, 1000);
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!channelRef.current || !text.trim()) return false;
        const now = Date.now();
        if (now - lastMessageTime.current < MESSAGE_COOLDOWN_MS) return false;
        lastMessageTime.current = now;

        const msg: GCMessage = {
            id: createMessageId(),
            senderId: myId.current,
            senderName: playerName || 'Anonymous',
            text: text.trim(),
            timestamp: now,
            type: 'chat',
            isAdmin,
        };

        setMessages(prev => {
            setTotalMessages(t => t + 1);
            return [...prev, msg];
        });
        channelRef.current.send({
            type: 'broadcast',
            event: 'gc',
            payload: { ...msg, type: 'chat' },
        });
        await saveMessageToDB(msg);
        return true;
    }, [playerName, saveMessageToDB, isAdmin]);

    const sendChallenge = useCallback((targetId: string, targetName: string, roomCode: string): Promise<void> => {
        return new Promise(async (resolve) => {
            if (!channelRef.current) { resolve(); return; }

            const msgText = `⚔️ ${playerName} challenged ${targetName}!`;
            const msgId = createMessageId();
            const timestamp = Date.now();

            // Save challenge system message to DB and show locally
            await addSystemMessage(msgText, true, msgId);

            channelRef.current.send({
                type: 'broadcast',
                event: 'gc',
                payload: {
                    type: 'challenge',
                    senderId: myId.current,
                    fromName: playerName,
                    to: targetId,
                    toName: targetName,
                    roomCode,
                    text: msgText,
                    msgId,
                    timestamp,
                },
            }).then(() => resolve()).catch(() => resolve());
        });
    }, [playerName, addSystemMessage, isAdmin]);

    const acceptChallenge = useCallback((): Promise<string | null> => {
        return new Promise(async (resolve) => {
            if (!pendingChallenge || !channelRef.current) { resolve(null); return; }
            const code = pendingChallenge.roomCode;
            const from = pendingChallenge.from;
            const challengerName = pendingChallenge.fromName;

            const msgText = `✅ ${playerName} accepted ${challengerName}'s challenge! Battle starting...`;
            const msgId = createMessageId();
            const timestamp = Date.now();

            setPendingChallenge(null);
            await addSystemMessage(msgText, true, msgId);

            channelRef.current.send({
                type: 'broadcast',
                event: 'gc',
                payload: {
                    type: 'challenge-accepted',
                    senderId: myId.current,
                    fromName: playerName,
                    to: from,
                    roomCode: code,
                    text: msgText,
                    msgId,
                    timestamp,
                },
            }).then(() => resolve(code)).catch(() => resolve(code));
        });
    }, [pendingChallenge, playerName, addSystemMessage, isAdmin]);

    const declineChallenge = useCallback(async () => {
        if (!pendingChallenge || !channelRef.current) return;

        const msgText = `❌ ${playerName} declined ${pendingChallenge.fromName}'s challenge`;
        const msgId = createMessageId();
        const timestamp = Date.now();

        // Save decline system message to DB and show locally
        await addSystemMessage(msgText, true, msgId);

        channelRef.current.send({
            type: 'broadcast',
            event: 'gc',
            payload: {
                type: 'challenge-declined',
                senderId: myId.current,
                fromName: playerName,
                to: pendingChallenge.from,
                toName: pendingChallenge.fromName,
                text: msgText,
                msgId,
                timestamp,
            },
        });
        setPendingChallenge(null);
    }, [pendingChallenge, playerName, addSystemMessage, isAdmin]);

    const clearChallengeAccepted = useCallback(() => {
        setChallengeAccepted(null);
    }, []);

    const clearChallengeDeclined = useCallback(() => {
        setChallengeDeclined(null);
    }, []);

    const cancelChallenge = useCallback(async (targetId: string, targetName: string, isTimeout = false) => {
        if (!channelRef.current) return;

        const msgText = isTimeout
            ? `⌛ Challenge invite from ${playerName} against ${targetName} expired`
            : `❌ ${playerName} cancelled the challenge against ${targetName}`;
        const msgId = createMessageId();
        const timestamp = Date.now();

        // Show locally to the challenger
        await addSystemMessage(msgText, true, msgId);

        // Broadcast to everyone else
        channelRef.current.send({
            type: 'broadcast',
            event: 'gc',
            payload: {
                type: 'challenge-cancelled',
                senderId: myId.current,
                fromName: playerName,
                to: targetId,
                text: msgText,
                msgId,
                timestamp,
            },
        });
    }, [playerName, addSystemMessage, isAdmin]);

    const updateStatus = useCallback((status: UserStatus) => {
        if (!channelRef.current) return;

        // Try to get IP from current presence to maintain it
        const currentState = channelRef.current.presenceState<GCPresence>();
        const myPresence = currentState[myId.current]?.[0];

        channelRef.current.track({
            name: playerName,
            status,
            joinedAt: Date.now(),
            ip: myPresence?.ip || 'unknown',
            isAdmin,
        });
    }, [playerName, isAdmin]);

    const verifyAdmin = useCallback((secret: string) => {
        const actual = import.meta.env.VITE_ADMIN_SECRET;
        if (actual && secret === actual) {
            localStorage.setItem('kf_gc_admin_secret', secret);
            setIsAdmin(true);
            // Re-track with admin status
            if (channelRef.current) {
                const currentState = channelRef.current.presenceState<GCPresence>();
                const myPresence = currentState[myId.current]?.[0];
                channelRef.current.track({
                    name: playerName,
                    status: myPresence?.status || 'idle',
                    joinedAt: Date.now(),
                    ip: myPresence?.ip || 'unknown',
                    isAdmin: true,
                });
            }
            return true;
        }
        return false;
    }, [playerName]);

    const deleteMessage = useCallback(async (msgId: string) => {
        if (!isAdmin || !channelRef.current) return;

        try {
            // 1. Update DB
            const { error: updateError } = await supabase
                .from('gc_messages')
                .update({ text: 'This message is deleted by Admin' })
                .eq('id', msgId);

            if (updateError) throw updateError;

            // 2. Broadcast to all clients
            channelRef.current.send({
                type: 'broadcast',
                event: 'gc',
                payload: {
                    type: 'message-deleted',
                    msgId,
                },
            });

            // 3. Update locally
            setMessages(prev => prev.map(m =>
                m.id === msgId
                    ? { ...m, text: 'This message is deleted by Admin' }
                    : m
            ));

            return true;
        } catch (e) {
            console.warn('Delete failed:', e);
            return false;
        }
    }, [isAdmin]);

    const logoutAdmin = useCallback(() => {
        localStorage.removeItem('kf_gc_admin_secret');
        setIsAdmin(false);
        // Re-track with non-admin status
        if (channelRef.current) {
            const currentState = channelRef.current.presenceState<GCPresence>();
            const myPresence = currentState[myId.current]?.[0];
            channelRef.current.track({
                name: playerName,
                status: myPresence?.status || 'idle',
                joinedAt: Date.now(),
                ip: myPresence?.ip || 'unknown',
                isAdmin: false,
            });
        }
        addSystemMessage('Admin session terminated');
    }, [playerName, addSystemMessage]);

    useEffect(() => {
        if (!pendingChallenge) return;
        const t = setTimeout(() => {
            setPendingChallenge(null);
        }, 15000);
        return () => clearTimeout(t);
    }, [pendingChallenge]);

    useEffect(() => {
        if (!isConnected) return;
        const interval = setInterval(fetchTotalCount, 60000); // Re-sync every minute
        return () => clearInterval(interval);
    }, [isConnected, fetchTotalCount]);

    useEffect(() => {
        return () => {
            if (!suppressCleanupRef.current && channelRef.current) {
                channelRef.current.untrack();
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, []);

    return {
        isConnected,
        isLoadingHistory,
        onlineUsers,
        messages,
        totalMessages,
        hasMore,
        pendingChallenge,
        challengeAccepted,
        challengeDeclined,
        isAdmin,
        error,
        myId: myId.current,
        join,
        leave,
        leaveSilently,
        sendMessage,
        loadMoreHistory,
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        clearChallengeAccepted,
        clearChallengeDeclined,
        updateStatus,
        cancelChallenge,
        verifyAdmin,
        logoutAdmin,
        deleteMessage,
    };
};
