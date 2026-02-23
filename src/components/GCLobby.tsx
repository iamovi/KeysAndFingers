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

const GCLobby = ({ playerName, onJoin, onResetName, onExit, onJoinVsFromGC, onCreateChallengeRoom }: GCLobbyProps) => {
    const [localName, setLocalName] = useState('');
    const {
        isConnected,
        isLoadingHistory,
        onlineUsers,
        messages,
        pendingChallenge,
        challengeAccepted,
        challengeDeclined,
        error,
        myId,
        join,
        leave,
        leaveSilently,
        sendMessage,
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSetName = (e: React.FormEvent) => {
        e.preventDefault();
        if (localName.trim()) {
            onJoin(localName.trim());
        }
    };

    useEffect(() => {
        join();
    }, [join]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    // When opponent accepts our challenge → show toast then go to VS as host
    useEffect(() => {
        if (!challengeAccepted) return;
        const { roomCode, byName } = challengeAccepted;
        clearChallengeAccepted();
        setIsChallenging(false);
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
        toast.error(`${challengeDeclined} declined your challenge`);
    }, [challengeDeclined, clearChallengeDeclined]);

    // When we receive a challenge → show persistent toast with Accept/Decline buttons
    useEffect(() => {
        if (!pendingChallenge) return;
        toast(
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Swords className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-mono font-bold">
                        {pendingChallenge.fromName} challenged you!
                    </span>
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
                duration: 30000,
                onDismiss: () => declineChallenge(),
            }
        );
    }, [acceptChallenge, declineChallenge, leaveSilently, onJoinVsFromGC, pendingChallenge]);

    const handleSend = useCallback(() => {
        if (!input.trim()) return;
        const sent = sendMessage(input.trim());
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

    // Challenger: send challenge and STAY in GC waiting for response
    const handleChallenge = useCallback(async (user: GCUser) => {
        setChallenging(user.id);
        try {
            const roomCode = onCreateChallengeRoom();
            await sendChallenge(user.id, user.name, roomCode);
            sessionStorage.setItem('kf_gc_host_code', roomCode);
            setIsChallenging(true);
        } catch {
            toast.error('Failed to send challenge');
        } finally {
            setChallenging(null);
        }
    }, [sendChallenge, onCreateChallengeRoom]);

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
                    {myUser && (
                        <button
                            onClick={() => { leave(); onResetName(); }}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border hover:bg-secondary/60 transition-colors group"
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
                                Waiting for opponent to accept your challenge...
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                setIsChallenging(false);
                                sessionStorage.removeItem('kf_gc_host_code');
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
                    <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${activeTab === 'users' ? 'hidden sm:block' : ''}`}>
                        {isLoadingHistory && (
                            <div className="flex items-center justify-center gap-2 py-3 opacity-50">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                <span className="text-[10px] font-mono text-muted-foreground">Loading chat history...</span>
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
                                        <div className={`max-w-[75%] ${msg.senderId === myId ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                                            <span className={`text-[9px] font-mono text-muted-foreground ${msg.senderId === myId ? 'text-right' : ''}`}>
                                                {msg.senderId === myId ? 'you' : msg.senderName}
                                            </span>
                                            <div className={`px-3 py-1.5 rounded-lg text-xs font-mono leading-relaxed break-words
                                                ${msg.senderId === myId
                                                    ? 'bg-amber-500/15 border border-amber-500/20 text-foreground rounded-tr-sm'
                                                    : 'bg-secondary/60 border border-border text-foreground rounded-tl-sm'
                                                }`}
                                            >
                                                {msg.text}
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
                                    <Crown className="h-3 w-3 text-amber-500 shrink-0" />
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
                    <p className="text-xs font-mono font-bold truncate">{user.name}</p>
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
