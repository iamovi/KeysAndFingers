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
const MAX_MESSAGES = 200;
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

export const useGCLobby = (playerName: string | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<GCUser[]>([]);
    const [messages, setMessages] = useState<GCMessage[]>([]);
    const [pendingChallenge, setPendingChallenge] = useState<ChallengeInvite | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [challengeAccepted, setChallengeAccepted] = useState<{ roomCode: string; byName: string } | null>(null);
    const [challengeDeclined, setChallengeDeclined] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const myId = useRef<string>(getStoredUserId());
    const lastMessageTime = useRef<number>(0);
    const suppressCleanupRef = useRef(false);
    const loadedFromDB = useRef<Set<string>>(new Set());

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
    const addSystemMessage = useCallback((text: string, saveToDb = false, id?: string) => {
        const msg: GCMessage = {
            id: id || createMessageId(),
            senderId: 'system',
            senderName: 'System',
            text,
            timestamp: Date.now(),
            type: 'system',
        };
        setMessages(prev => [...prev, msg].slice(-MAX_MESSAGES));
        if (saveToDb) {
            void saveMessageToDB(msg);
        }
    }, [saveMessageToDB]);

    // Load last 7 days of messages from Supabase DB
    const loadHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data, error: dbError } = await supabase
                .from('gc_messages')
                .select('*')
                .gte('created_at', sevenDaysAgo)
                .order('created_at', { ascending: false })
                .limit(200);

            if (dbError) {
                console.warn('GC history load failed:', dbError.message);
                return;
            }

            if (data && data.length > 0) {
                const historyMessages: GCMessage[] = data.reverse().map(row => ({
                    id: row.id,
                    senderId: row.sender_id,
                    senderName: row.sender_name,
                    text: row.text,
                    timestamp: new Date(row.created_at).getTime(),
                    type: row.sender_id === 'system' ? 'system' as const : 'chat' as const,
                }));

                historyMessages.forEach(m => loadedFromDB.current.add(m.id));

                setMessages(prev => {
                    const combined = [...historyMessages, ...prev];
                    const seen = new Set<string>();
                    return combined.filter(m => {
                        if (seen.has(m.id)) return false;
                        seen.add(m.id);
                        return true;
                    }).slice(-MAX_MESSAGES);
                });
            }
        } catch (e) {
            console.warn('GC history load error:', e);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);


    const join = useCallback(async () => {
        if (!playerName || channelRef.current) return;
        suppressCleanupRef.current = false;
        setError(null);

        await loadHistory();

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
            const users = (Object.entries(state)
                .map(([id, presences]) => {
                    const presence = presences[0];
                    if (!presence) return null;
                    return {
                        id,
                        name: presence.name,
                        status: presence.status,
                        joinedAt: presence.joinedAt,
                        ip: presence.ip,
                    } as GCUser;
                })
                .filter((user): user is GCUser => user !== null)) as GCUser[];
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
                setMessages(prev => [...prev, msg].slice(-MAX_MESSAGES));
            }

            if (payload.type === 'challenge') {
                // Show challenge message to everyone
                if (payload.text) {
                    const msg: GCMessage = {
                        id: payload.msgId || createMessageId(),
                        senderId: 'system',
                        senderName: 'System',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'system',
                    };
                    setMessages(prev => [...prev, msg].slice(-MAX_MESSAGES));
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
                // Show accept message to everyone
                if (payload.text) {
                    const msg: GCMessage = {
                        id: payload.msgId || createMessageId(),
                        senderId: 'system',
                        senderName: 'System',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'system',
                    };
                    setMessages(prev => [...prev, msg].slice(-MAX_MESSAGES));
                }

                if (payload.to === myId.current) {
                    setChallengeAccepted({ roomCode: payload.roomCode, byName: payload.fromName });
                }
            }

            if (payload.type === 'challenge-cancelled') {
                // Show cancellation message to everyone in chat
                if (payload.text) {
                    const msg: GCMessage = {
                        id: payload.msgId || createMessageId(),
                        senderId: 'system',
                        senderName: 'System',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'system',
                    };
                    setMessages(prev => [...prev, msg].slice(-MAX_MESSAGES));
                }
                // Clear the pending challenge on the receiver side
                if (payload.to === myId.current) {
                    setPendingChallenge(null);
                }
            }

            if (payload.type === 'challenge-declined') {
                // Show decline message to everyone
                if (payload.text) {
                    const msg: GCMessage = {
                        id: payload.msgId || createMessageId(),
                        senderId: 'system',
                        senderName: 'System',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'system',
                    };
                    setMessages(prev => [...prev, msg].slice(-MAX_MESSAGES));
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

    const sendMessage = useCallback((text: string) => {
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

        setMessages(prev => [...prev, msg].slice(-MAX_MESSAGES));
        channelRef.current.send({
            type: 'broadcast',
            event: 'gc',
            payload: { ...msg, type: 'chat' },
        });
        saveMessageToDB(msg);
        return true;
    }, [playerName, saveMessageToDB]);

    const sendChallenge = useCallback((targetId: string, targetName: string, roomCode: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!channelRef.current) { resolve(); return; }

            const msgText = `⚔️ ${playerName} challenged ${targetName}!`;
            const msgId = createMessageId();
            const timestamp = Date.now();

            // Save challenge system message to DB and show locally
            addSystemMessage(msgText, true, msgId);

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
    }, [playerName, addSystemMessage]);

    const acceptChallenge = useCallback((): Promise<string | null> => {
        return new Promise((resolve) => {
            if (!pendingChallenge || !channelRef.current) { resolve(null); return; }
            const code = pendingChallenge.roomCode;
            const from = pendingChallenge.from;
            const challengerName = pendingChallenge.fromName;

            const msgText = `✅ ${playerName} accepted ${challengerName}'s challenge! Battle starting...`;
            const msgId = createMessageId();
            const timestamp = Date.now();

            setPendingChallenge(null);
            addSystemMessage(msgText, true, msgId);

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
    }, [pendingChallenge, playerName, addSystemMessage]);

    const declineChallenge = useCallback(() => {
        if (!pendingChallenge || !channelRef.current) return;

        const msgText = `❌ ${playerName} declined ${pendingChallenge.fromName}'s challenge`;
        const msgId = createMessageId();
        const timestamp = Date.now();

        // Save decline system message to DB and show locally
        addSystemMessage(msgText, true, msgId);

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
    }, [pendingChallenge, playerName, addSystemMessage]);

    const clearChallengeAccepted = useCallback(() => {
        setChallengeAccepted(null);
    }, []);

    const clearChallengeDeclined = useCallback(() => {
        setChallengeDeclined(null);
    }, []);

    const cancelChallenge = useCallback((targetId: string, targetName: string, isTimeout = false) => {
        if (!channelRef.current) return;

        const msgText = isTimeout
            ? `⌛ Challenge invite against ${targetName} expired`
            : `❌ ${playerName} cancelled the challenge against ${targetName}`;
        const msgId = createMessageId();
        const timestamp = Date.now();

        // Show locally to the challenger
        addSystemMessage(msgText, true, msgId);

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
    }, [playerName, addSystemMessage]);

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

    useEffect(() => {
        if (!pendingChallenge) return;
        const fromName = pendingChallenge.fromName;
        const t = setTimeout(() => {
            setPendingChallenge(null);
            addSystemMessage(`⌛ Challenge invite from ${fromName} expired`, true);
        }, 15000);
        return () => clearTimeout(t);
    }, [pendingChallenge, addSystemMessage]);

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
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        clearChallengeAccepted,
        clearChallengeDeclined,
        updateStatus,
        cancelChallenge,
        verifyAdmin,
        deleteMessage,
    };
};
