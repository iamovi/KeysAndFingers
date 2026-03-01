import { useState, useEffect, useRef, useCallback } from 'react';
import { useGCLobby, GCUser } from '@/hooks/useGCLobby';
import {
    MessageSquare,
    Users,
    Send,
    LogOut,
    Swords,
    Wifi,
    WifiOff,
    Crown,
    Loader2,
    X,
    Shield,
    Clock,
    Lock,
    Trash2,
    Activity,
} from 'lucide-react';
import { toast } from 'sonner';

interface GCLobbyProps {
    playerName: string | null;
    onJoin: (name: string) => void;
    onResetName: () => void;
    onExit: () => void;
    onJoinVsFromGC: (roomCode: string) => void;
    onCreateChallengeRoom: () => string;
}

const StatusDot = ({ status }: { status: 'idle' | 'busy' | 'in-race' }) => {
    const colors = {
        idle: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]',
        busy: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]',
        'in-race': 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]',
    };
    return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status]}`} />;
};

const StatusLabel = ({ status }: { status: 'idle' | 'busy' | 'in-race' }) => {
    const labels = { idle: 'idle', busy: 'busy', 'in-race': 'racing' };
    const colors = { idle: 'text-green-500', busy: 'text-amber-500', 'in-race': 'text-red-400' };
    return <span className={`text-[9px] font-mono uppercase ${colors[status]}`}>{labels[status]}</span>;
};

const ChallengeCountdown = ({ duration, onComplete }: { duration: number; onComplete?: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete?.();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    return (
        <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 tabular-nums">
            {timeLeft}s
        </span>
    );
};

const GCLobby = ({ playerName, onJoin, onResetName, onExit, onJoinVsFromGC, onCreateChallengeRoom }: GCLobbyProps) => {
    const [localName, setLocalName] = useState('');
    const {
        isConnected,
        isLoadingHistory,
        onlineUsers,
        messages,
        totalMessages,
        hasMore,
        pendingChallenge,
        challengeAccepted,
        challengeDeclined,
        updateStatus,
        cancelChallenge,
        isAdmin,
        verifyAdmin,
        logoutAdmin,
        deleteMessage,
        error,
        myId,
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
    } = useGCLobby(playerName);

    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
    const [challengingUser, setChallenging] = useState<string | null>(null);
    const [isChallenging, setIsChallenging] = useState(false);
    const [showAdminEntry, setShowAdminEntry] = useState(false);
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [adminKeyInput, setAdminKeyInput] = useState('');
    const challengeTargetIdRef = useRef<string | null>(null);
    const challengeTargetNameRef = useRef<string | null>(null);
    const challengeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
    const lastScrollHeightRef = useRef<number>(0);
    const isFirstLoadRef = useRef(true);
    const isPrependingRef = useRef(false);
    const prevOldestMessageId = useRef<string | null>(null);

    const handleSetName = (e: React.FormEvent) => {
        e.preventDefault();
        if (localName.trim()) {
            onJoin(localName.trim());
        }
    };

    useEffect(() => {
        join();
    }, [join]);

    // Handle Infinite Scroll Observer
    useEffect(() => {
        if (!hasMore || isLoadingHistory) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                // Record state before prepending
                if (scrollContainerRef.current) {
                    lastScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
                }
                loadMoreHistory();
            }
        }, { threshold: 0.1 });

        if (loadMoreSentinelRef.current) {
            observer.observe(loadMoreSentinelRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingHistory, loadMoreHistory]);

    // Intelligent Scroll Management
    useEffect(() => {
        if (!scrollContainerRef.current || messages.length === 0) return;

        const oldestId = messages[0].id;
        const container = scrollContainerRef.current;

        // Detection: Did we just fetch older messages?
        if (prevOldestMessageId.current && oldestId !== prevOldestMessageId.current) {
            isPrependingRef.current = true;
        } else {
            isPrependingRef.current = false;
        }
        prevOldestMessageId.current = oldestId;

        if (isFirstLoadRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            isFirstLoadRef.current = false;
            return;
        }

        if (isPrependingRef.current) {
            // Restore scroll position after prepending
            const newScrollHeight = container.scrollHeight;
            const heightDiff = newScrollHeight - lastScrollHeightRef.current;
            container.scrollTop = container.scrollTop + heightDiff;
            isPrependingRef.current = false;
        } else {
            // Auto-scroll to bottom only if user is already near bottom or it's my message
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            const lastMsg = messages[messages.length - 1];
            const isMyMessage = lastMsg?.senderId === myId;

            if (isAtBottom || isMyMessage) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [messages, myId]);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    // When opponent accepts our challenge → show toast then go to VS as host
    useEffect(() => {
        if (!challengeAccepted) return;
        const { roomCode, byName } = challengeAccepted;
        clearChallengeAccepted();
        setIsChallenging(false);
        if (challengeTimeoutRef.current) { clearTimeout(challengeTimeoutRef.current); challengeTimeoutRef.current = null; }
        challengeTargetIdRef.current = null;
        challengeTargetNameRef.current = null;
        toast.success(`${byName} accepted! Starting race...`, { duration: 2000 });
        setTimeout(() => {
            leaveSilently();
            sessionStorage.setItem('kf_gc_host_code', roomCode);
            onJoinVsFromGC(roomCode);
        }, 500);
    }, [challengeAccepted, clearChallengeAccepted, leaveSilently, onJoinVsFromGC]);

    // When opponent declines → hide the waiting banner
    useEffect(() => {
        if (!challengeDeclined) return;
        setIsChallenging(false);
        sessionStorage.removeItem('kf_gc_host_code');
        clearChallengeDeclined();
        if (challengeTimeoutRef.current) { clearTimeout(challengeTimeoutRef.current); challengeTimeoutRef.current = null; }
        challengeTargetIdRef.current = null;
        challengeTargetNameRef.current = null;
        updateStatus('idle'); // back to idle when opponent declines
        toast.error(`${challengeDeclined} declined your challenge`);
    }, [challengeDeclined, clearChallengeDeclined, updateStatus]);

    // When challenge is cancelled by challenger → dismiss the toast
    const prevPendingRef = useRef<typeof pendingChallenge>(null);
    useEffect(() => {
        if (prevPendingRef.current && !pendingChallenge) {
            // Had a challenge before, now it's gone — challenger cancelled it
            toast.dismiss('gc-challenge');
        }
        prevPendingRef.current = pendingChallenge;
    }, [pendingChallenge]);

    // When we receive a challenge → show persistent toast with Accept/Decline buttons
    useEffect(() => {
        if (!pendingChallenge) return;
        toast(
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Swords className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-sm font-mono font-bold">
                            {pendingChallenge.fromName} challenged you!
                        </span>
                    </div>
                    <ChallengeCountdown duration={15} />
                </div>
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={async () => {
                            toast.dismiss('gc-challenge');
                            const code = await acceptChallenge();
                            if (code) {
                                leaveSilently();
                                sessionStorage.setItem('kf_gc_join_code', code);
                                onJoinVsFromGC(code);
                            }
                        }}
                        className="flex-1 py-1.5 text-xs font-mono font-bold bg-amber-500 text-black rounded hover:bg-amber-400 transition-colors"
                    >
                        ACCEPT
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss('gc-challenge');
                            declineChallenge();
                        }}
                        className="flex-1 py-1.5 text-xs font-mono text-muted-foreground border border-border rounded hover:bg-secondary transition-colors"
                    >
                        DECLINE
                    </button>
                </div>
            </div>,
            {
                id: 'gc-challenge',
                duration: 15000,
                onDismiss: () => declineChallenge(),
            }
        );
    }, [acceptChallenge, declineChallenge, leaveSilently, onJoinVsFromGC, pendingChallenge, isAdmin]);

    const handleSend = useCallback(async () => {
        if (!input.trim()) return;
        const sent = await sendMessage(input.trim());
        if (sent) {
            setInput('');
        } else {
            toast.error('Slow down! Wait a moment before sending again.');
        }
    }, [input, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-reset busy status after 30s if opponent never responds

    // Challenger: send challenge and STAY in GC waiting for response
    const handleChallenge = useCallback(async (user: GCUser) => {
        setChallenging(user.id);
        try {
            const roomCode = onCreateChallengeRoom();
            await sendChallenge(user.id, user.name, roomCode);
            sessionStorage.setItem('kf_gc_host_code', roomCode);
            setIsChallenging(true);
            challengeTargetIdRef.current = user.id;
            challengeTargetNameRef.current = user.name;
            updateStatus('busy'); // show as busy while waiting for opponent response

            // Auto-reset after 15s if no response (matches receiver timeout)
            if (challengeTimeoutRef.current) clearTimeout(challengeTimeoutRef.current);
            challengeTimeoutRef.current = setTimeout(() => {
                setIsChallenging(false);
                sessionStorage.removeItem('kf_gc_host_code');
                if (challengeTargetIdRef.current && challengeTargetNameRef.current) {
                    cancelChallenge(challengeTargetIdRef.current, challengeTargetNameRef.current, true);
                    challengeTargetIdRef.current = null;
                    challengeTargetNameRef.current = null;
                }
                updateStatus('idle');
                toast.error('Challenge expired — no response');
                challengeTimeoutRef.current = null;
            }, 15000);
        } catch {
            toast.error('Failed to send challenge');
        } finally {
            setChallenging(null);
        }
    }, [sendChallenge, onCreateChallengeRoom, updateStatus, cancelChallenge]);

    const otherUsers = onlineUsers.filter(u => u.id !== myId);
    const myUser = onlineUsers.find(u => u.id === myId);

    if (!playerName) {
        return (
            <div className="max-w-md mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-2">
                        <MessageSquare className="h-8 w-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold font-mono glitch-text" data-text="Join the Lobby">
                        Join the Lobby
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">
                        Enter a nickname to chat and challenge others
                    </p>
                </div>
                <form onSubmit={handleSetName} className="space-y-4">
                    <input
                        type="text"
                        value={localName}
                        onChange={e => setLocalName(e.target.value)}
                        placeholder="YOUR NICKNAME"
                        autoFocus
                        maxLength={12}
                        className="w-full text-center text-xl font-mono font-bold uppercase bg-background border-2 border-border rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-all shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!localName.trim()}
                        className="w-full py-4 bg-green-600 text-white font-mono font-bold rounded-lg shadow-lg hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        JOIN LOBBY
                    </button>
                    <button type="button" onClick={onExit} className="w-full py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                        CANCEL
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-4 h-[calc(100vh-120px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold font-mono glitch-text" data-text="Public Lobby">
                            Public Lobby
                        </h2>
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <>
                                    <Wifi className="h-3 w-3 text-green-500" />
                                    <span className="text-[10px] font-mono text-green-500">
                                        {onlineUsers.length} online
                                    </span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] font-mono text-muted-foreground">connecting...</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => isAdmin ? setShowAdminDashboard(true) : setShowAdminEntry(true)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded border transition-all ${isAdmin
                            ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                            : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                            }`}
                    >
                        <Shield className="h-3 w-3" />
                        <span>{isAdmin ? 'ADMIN AREA!' : 'Admin Area!'}</span>
                    </button>
                    {myUser && (
                        <button
                            onClick={() => { leave(); onResetName(); }}
                            className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary/40 border border-border hover:bg-secondary/60 transition-colors group shrink-0"
                        >
                            <StatusDot status={myUser.status} />
                            <span className="text-xs font-mono font-bold">{playerName}</span>
                            <span className="text-[10px] font-mono text-green-500 underline underline-offset-2 opacity-70 group-hover:opacity-100 transition-opacity">CHANGE</span>
                        </button>
                    )}
                    <button
                        onClick={() => { leave(); onExit(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border rounded-sm hover:bg-secondary"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Leave</span>
                    </button>
                </div>
            </div>

            {/* Waiting for response banner (shown to challenger) */}
            {isChallenging && (
                <div className="mb-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                            <span className="text-xs font-mono text-amber-500">
                                Waiting for opponent to accept...
                            </span>
                            <ChallengeCountdown duration={15} />
                        </div>
                        <button
                            onClick={() => {
                                setIsChallenging(false);
                                sessionStorage.removeItem('kf_gc_host_code');
                                if (challengeTimeoutRef.current) { clearTimeout(challengeTimeoutRef.current); challengeTimeoutRef.current = null; }
                                if (challengeTargetIdRef.current && challengeTargetNameRef.current) {
                                    cancelChallenge(challengeTargetIdRef.current, challengeTargetNameRef.current);
                                    challengeTargetIdRef.current = null;
                                    challengeTargetNameRef.current = null;
                                }
                                updateStatus('idle');
                            }}
                            className="shrink-0 p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Cancel challenge"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex gap-3 min-h-0">

                {/* Chat area */}
                <div className="flex-1 flex flex-col min-w-0 rounded-lg border border-border bg-card overflow-hidden">

                    {/* Mobile tabs */}
                    <div className="flex sm:hidden border-b border-border shrink-0">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-2 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'chat' ? 'bg-secondary/50 text-foreground' : 'text-muted-foreground'}`}
                        >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 py-2 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'users' ? 'bg-secondary/50 text-foreground' : 'text-muted-foreground'}`}
                        >
                            <Users className="h-3.5 w-3.5" /> Players ({otherUsers.length})
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-y-auto p-3 space-y-2 ${activeTab === 'users' ? 'hidden sm:block' : ''}`}
                    >
                        {/* Load More Sentinel */}
                        {hasMore && (
                            <div ref={loadMoreSentinelRef} className="h-4 w-full flex items-center justify-center">
                                {isLoadingHistory && (
                                    <div className="flex items-center gap-2 opacity-50">
                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                        <span className="text-[9px] font-mono text-muted-foreground">fetching more...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isLoadingHistory && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-40">
                                <MessageSquare className="h-10 w-10 text-muted-foreground" />
                                <p className="text-xs font-mono text-muted-foreground">
                                    No messages yet. Say hello!
                                </p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id}>
                                {msg.type === 'system' ? (
                                    <div className="text-center">
                                        <span className="text-[10px] font-mono text-muted-foreground/60 italic">
                                            — {msg.text} —
                                        </span>
                                    </div>
                                ) : (
                                    <div className={`flex items-start gap-2 group ${msg.senderId === myId ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono font-bold
                                            ${msg.senderId === myId
                                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            }`}
                                        >
                                            {msg.senderName[0]?.toUpperCase()}
                                        </div>
                                        <div className={`flex flex-col gap-1 ${msg.senderId === myId ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-center gap-1.5 ${msg.senderId === myId ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-[9px] font-mono text-muted-foreground ${msg.senderId === myId ? 'text-right' : ''}`}>
                                                    {msg.senderId === myId ? 'you' : msg.senderName}
                                                </span>
                                                {msg.isAdmin && (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
                                                        <Shield className="h-[9px] w-[9px] text-amber-500" />
                                                        <span className="text-[8px] font-mono font-bold text-amber-500 leading-none">ADMIN</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1.5 rounded-lg text-xs font-mono leading-relaxed break-words
                                                    ${msg.senderId === myId
                                                        ? 'bg-amber-500/15 border border-amber-500/20 text-foreground rounded-tr-sm'
                                                        : 'bg-secondary/60 border border-border text-foreground rounded-tl-sm'
                                                    }`}
                                                >
                                                    {msg.text}
                                                </div>
                                                {isAdmin && msg.senderId !== 'system' && msg.text !== 'This message is deleted by Admin' && (
                                                    <button
                                                        onClick={() => deleteMessage(msg.id)}
                                                        className="p-1.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete Message"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Mobile users list */}
                    {activeTab === 'users' && (
                        <div className="flex-1 overflow-y-auto p-3 sm:hidden">
                            <UsersList
                                users={otherUsers}
                                myId={myId}
                                onChallenge={handleChallenge}
                                challengingUser={challengingUser}
                            />
                        </div>
                    )}

                    {/* Input */}
                    <div className={`border-t border-border p-3 shrink-0 ${activeTab === 'users' ? 'sm:block hidden' : ''}`}>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isConnected ? "Say something..." : "Connecting..."}
                                disabled={!isConnected}
                                maxLength={200}
                                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-border disabled:opacity-40 transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!isConnected || !input.trim()}
                                className="p-2 rounded-md bg-foreground text-background hover:opacity-80 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-[9px] font-mono text-muted-foreground/40 mt-1 text-right">
                            {input.length}/200
                        </p>
                    </div>
                </div>

                {/* Sidebar: online users (desktop) */}
                <div className="hidden sm:flex w-56 flex-col rounded-lg border border-border bg-card overflow-hidden shrink-0">
                    <div className="px-3 py-2.5 border-b border-border shrink-0">
                        <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
                                Players — {onlineUsers.length}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {myUser && (
                            <button
                                onClick={() => { leave(); onResetName(); }}
                                className="w-full text-left mb-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <StatusDot status={myUser.status} />
                                    <span className="text-xs font-mono font-bold truncate flex-1">{playerName}</span>
                                    {isAdmin && <Crown className="h-3 w-3 text-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />}
                                </div>
                                <div className="flex items-center justify-between">
                                    <StatusLabel status={myUser.status} />
                                    <span className="text-[9px] font-mono text-amber-500 underline opacity-0 group-hover:opacity-100 transition-opacity">CHANGE</span>
                                </div>
                            </button>
                        )}
                        <UsersList
                            users={otherUsers}
                            myId={myId}
                            onChallenge={handleChallenge}
                            challengingUser={challengingUser}
                        />
                        {otherUsers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-40">
                                <Shield className="h-6 w-6 text-muted-foreground" />
                                <p className="text-[10px] font-mono text-muted-foreground text-center">
                                    No other players yet
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Password Entry */}
            {showAdminEntry && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border p-6 rounded-xl shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-500">
                                <Lock className="h-5 w-5" />
                                <h3 className="font-mono font-bold">Encrypted Area</h3>
                            </div>
                            <button onClick={() => setShowAdminEntry(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-xs font-mono text-muted-foreground">Please enter the secret master key to access administrative controls.</p>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (verifyAdmin(adminKeyInput)) {
                                setShowAdminEntry(false);
                                setShowAdminDashboard(true);
                                setAdminKeyInput('');
                                toast.success('Access Granted. Welcome, Admin.');
                            } else {
                                toast.error('Access Denied. Incorrect key.');
                            }
                        }}>
                            <input
                                type="password"
                                value={adminKeyInput}
                                onChange={e => setAdminKeyInput(e.target.value)}
                                placeholder="SECRET_KEY"
                                autoFocus
                                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-red-500 transition-all text-center tracking-widest"
                            />
                            <button
                                type="submit"
                                className="w-full mt-4 py-3 bg-red-600/90 hover:bg-red-600 text-white font-mono font-bold rounded-lg transition-all shadow-lg"
                            >
                                AUTHORIZE ACCESS
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Dashboard */}
            {showAdminDashboard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card border border-border w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <Activity className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-mono font-bold text-red-500">ADMIN CONTROL CENTER</h3>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-50 tracking-tighter">Real-time System Monitor</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        logoutAdmin();
                                        setShowAdminDashboard(false);
                                        toast.success('Admin authorization revoked.');
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded font-mono text-xs transition-colors"
                                >
                                    <Shield className="h-4 w-4" /> REVOKE ACCESS
                                </button>
                                <button
                                    onClick={() => setShowAdminDashboard(false)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded font-mono text-xs transition-colors"
                                >
                                    <X className="h-4 w-4" /> CLOSE
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex overflow-hidden">
                            {/* Player Logs */}
                            <div className="flex-1 flex flex-col border-r border-border">
                                <div className="p-3 bg-secondary/20 border-b border-border">
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Active Users & IP Trace</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {onlineUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/50 group hover:border-red-500/40 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${user.status === 'idle' ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_currentColor]`} />
                                                <div>
                                                    <p className="font-mono font-bold text-xs">{user.name}</p>
                                                    <p className="text-[9px] font-mono text-muted-foreground tabular-nums">ID: {user.id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-mono text-red-500/70 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">{user.ip || '---.---.---.---'}</p>
                                                <p className="text-[9px] font-mono text-muted-foreground uppercase mt-1">{user.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* System Status */}
                            <div className="w-64 bg-secondary/10 p-4 space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-mono font-bold text-muted-foreground mb-3 uppercase tracking-widest">Global Stats</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 rounded bg-background border border-border/50 shadow-sm">
                                            <p className="text-[9px] font-mono text-muted-foreground uppercase">Online Players</p>
                                            <p className="text-xl font-mono font-bold text-red-500">{onlineUsers.length}</p>
                                        </div>
                                        <div className="p-3 rounded bg-background border border-border/50 shadow-sm">
                                            <p className="text-[9px] font-mono text-muted-foreground uppercase">Total Messages</p>
                                            <p className="text-xl font-mono font-bold text-red-500">{totalMessages}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                                    <p className="text-[9px] font-mono text-red-500 leading-relaxed italic">
                                        Admin mode grants you full visibility of client IP addresses and message moderation. Use responsibly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const UsersList = ({
    users,
    myId,
    onChallenge,
    challengingUser,
}: {
    users: GCUser[];
    myId: string;
    onChallenge: (user: GCUser) => void;
    challengingUser: string | null;
}) => (
    <div className="space-y-1.5">
        {users.map(user => (
            <div
                key={user.id}
                className="group flex items-center gap-2 p-2 rounded-md hover:bg-secondary/40 transition-colors"
            >
                <StatusDot status={user.status} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-mono font-bold truncate">{user.name}</p>
                        {user.isAdmin && <Shield className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
                    </div>
                    <StatusLabel status={user.status} />
                </div>
                {user.status === 'idle' && (
                    <button
                        onClick={() => onChallenge(user)}
                        disabled={!!challengingUser}
                        className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title={`Challenge ${user.name}`}
                    >
                        {challengingUser === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Swords className="h-3 w-3" />
                        )}
                    </button>
                )}
            </div>
        ))}
    </div>
);

export default GCLobby;
