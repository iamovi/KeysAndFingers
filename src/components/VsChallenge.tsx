import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeerChallenge, PlayerProgress } from '@/hooks/usePeerChallenge';
import { useTypingGame } from '@/hooks/useTypingGame';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import TypingArea from '@/components/TypingArea';
import {
    Copy,
    Check,
    Swords,
    UserPlus,
    LogOut,
    Trophy,
    RotateCcw,
    Zap,
    Target,
    Clock,
    Wifi,
    WifiOff,
    Crown,
    Loader2,
} from 'lucide-react';

interface VsChallengeProps {
    onExit: () => void;
    soundEnabled: boolean;
}

const VsChallenge = ({ onExit, soundEnabled }: VsChallengeProps) => {
    const {
        phase,
        roomCode,
        isHost,
        opponentConnected,
        opponentProgress,
        countdown,
        error,
        createRoom,
        joinRoom,
        sendProgress,
        sendFinish,
        requestRematch,
        leaveRoom,
        challengeText,
    } = usePeerChallenge();

    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [myFinishData, setMyFinishData] = useState<PlayerProgress | null>(null);

    // Use empty string when no text yet, swap in when text arrives
    const activeText = challengeText ?? '';
    const { stats, userInput, handleInput, reset, targetText } = useTypingGame(activeText);
    const { playKeystroke, playError, playComplete, playMilestone } = useSoundEffects(soundEnabled);

    const prevInputLen = useRef(0);

    // Reset game state when text changes (new challenge or rematch)
    useEffect(() => {
        if (challengeText) {
            reset();
            setMyFinishData(null);
            prevInputLen.current = 0;
        }
    }, [challengeText]);

    // Sound effects
    useEffect(() => {
        if (phase !== 'racing') return;
        if (userInput.length > prevInputLen.current) {
            const i = userInput.length - 1;
            if (userInput[i] === activeText[i]) {
                playKeystroke();
            } else {
                playError();
            }
            const progress = Math.round((userInput.length / activeText.length) * 100);
            const prevProgress = Math.round((prevInputLen.current / activeText.length) * 100);
            if (Math.floor(progress / 25) > Math.floor(prevProgress / 25) && progress < 100) {
                playMilestone();
            }
        }
        prevInputLen.current = userInput.length;
    }, [userInput, phase]);

    // Send progress updates while racing
    useEffect(() => {
        if (phase !== 'racing' || stats.isComplete) return;
        const p: PlayerProgress = {
            progress: stats.progress,
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            correctChars: stats.correctChars,
            incorrectChars: stats.incorrectChars,
            elapsedTime: stats.elapsedTime,
            finished: false,
            finishTime: null,
        };
        sendProgress(p);
    }, [stats.progress, stats.wpm, phase]);

    // Handle completion
    useEffect(() => {
        if (phase === 'racing' && stats.isComplete && !myFinishData) {
            playComplete();
            const finish: PlayerProgress = {
                progress: 100,
                wpm: stats.wpm,
                accuracy: stats.accuracy,
                correctChars: stats.correctChars,
                incorrectChars: stats.incorrectChars,
                elapsedTime: stats.elapsedTime,
                finished: true,
                finishTime: Date.now(),
            };
            setMyFinishData(finish);
            sendFinish(finish);
        }
    }, [stats.isComplete, phase, myFinishData]);

    const handleCopyCode = useCallback(() => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [roomCode]);

    const handleLeave = useCallback(() => {
        leaveRoom();
        onExit();
    }, [leaveRoom, onExit]);

    const handleRematch = useCallback(() => {
        setMyFinishData(null);
        reset();
        prevInputLen.current = 0;
        requestRematch();
    }, [requestRematch, reset]);

    // ===== IDLE: Choose create or join =====
    if (phase === 'idle') {
        return (
            <div className="max-w-lg mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 mb-2">
                        <Swords className="h-8 w-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold font-mono glitch-text" data-text="VS Challenge">
                        VS Challenge
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">
                        Race against a friend in real-time typing battle
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Create Room */}
                    <button
                        onClick={createRoom}
                        className="vs-card group flex flex-col items-center gap-3 p-6 rounded-lg border border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Swords className="h-6 w-6 text-amber-500" />
                        </div>
                        <span className="text-sm font-mono font-bold">Create Room</span>
                        <span className="text-xs text-muted-foreground font-mono text-center">
                            Get a code to share with your opponent
                        </span>
                    </button>

                    {/* Join Room */}
                    <div className="flex flex-col gap-3 p-6 rounded-lg border border-border bg-card vs-card">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                <UserPlus className="h-6 w-6 text-blue-500" />
                            </div>
                            <span className="text-sm font-mono font-bold">Join Room</span>
                        </div>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="ENTER CODE"
                            maxLength={6}
                            className="w-full text-center text-lg font-mono font-bold tracking-[0.3em] uppercase bg-background border border-border rounded-md px-3 py-2 placeholder:text-muted-foreground/40 placeholder:tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        />
                        <button
                            onClick={() => joinRoom(joinCode)}
                            disabled={joinCode.length < 4}
                            className="w-full px-4 py-2 text-xs font-mono font-bold rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Join
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center">
                        <p className="text-xs font-mono text-destructive">{error}</p>
                    </div>
                )}

                <div className="text-center">
                    <button
                        onClick={onExit}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <LogOut className="h-3 w-3" />
                        Back to Solo
                    </button>
                </div>
            </div>
        );
    }

    // ===== LOBBY: Waiting for opponent =====
    if (phase === 'lobby') {
        return (
            <div className="max-w-lg mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold font-mono glitch-text" data-text="Waiting...">
                        {opponentConnected ? 'Opponent Connected!' : 'Waiting for Opponent...'}
                    </h2>
                </div>

                {/* Room Code Display */}
                {roomCode && isHost && (
                    <div className="space-y-3 p-6 rounded-lg border border-border bg-card text-center">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                            Share this code
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-mono font-bold tracking-[0.4em] text-amber-500">
                                {roomCode}
                            </span>
                            <button
                                onClick={handleCopyCode}
                                className="p-2 rounded-md hover:bg-secondary transition-colors"
                                title="Copy code"
                            >
                                {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Connection Status */}
                <div className="flex items-center justify-center gap-3 p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-mono">You ({isHost ? 'Host' : 'Guest'})</span>
                    </div>
                    <span className="text-muted-foreground font-mono">vs</span>
                    <div className="flex items-center gap-2">
                        {opponentConnected ? (
                            <>
                                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                                <Wifi className="h-3.5 w-3.5 text-success" />
                            </>
                        ) : (
                            <>
                                <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                            </>
                        )}
                        <span className="text-xs font-mono text-muted-foreground">
                            {opponentConnected ? 'Connected' : 'Waiting...'}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center">
                        <p className="text-xs font-mono text-destructive">{error}</p>
                    </div>
                )}

                <div className="text-center">
                    <button
                        onClick={handleLeave}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <LogOut className="h-3 w-3" />
                        Leave Room
                    </button>
                </div>
            </div>
        );
    }

    // ===== COUNTDOWN =====
    if (phase === 'countdown') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
                <div className="text-center space-y-4 animate-in zoom-in-50 duration-300">
                    <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Get Ready</p>
                    <div className="vs-countdown-number text-8xl font-bold font-mono text-amber-500">
                        {countdown > 0 ? countdown : 'GO!'}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                        Race starts {countdown > 0 ? 'in...' : 'now!'}
                    </p>
                </div>
            </div>
        );
    }

    // ===== RACING =====
    if (phase === 'racing') {
        const myProgress = stats.progress;
        const oppProgress = opponentProgress.progress;

        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                {/* Race Progress Bars */}
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
                            Race Progress
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Wifi className="h-3 w-3 text-success" />
                            <span className="text-[10px] font-mono text-success">Live</span>
                        </div>
                    </div>

                    {/* You */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                                You
                            </span>
                            <span className="tabular-nums">{stats.wpm} WPM · {stats.accuracy}%</span>
                        </div>
                        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border/50">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-200 ease-out relative"
                                style={{ width: `${myProgress}%` }}
                            >
                                {myProgress > 5 && (
                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-white">
                                        {myProgress}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Opponent */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                Opponent
                            </span>
                            <span className="tabular-nums">{opponentProgress.wpm} WPM · {opponentProgress.accuracy}%</span>
                        </div>
                        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border/50">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-200 ease-out relative"
                                style={{ width: `${oppProgress}%` }}
                            >
                                {oppProgress > 5 && (
                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-white">
                                        {oppProgress}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 rounded-md border border-border bg-card/50">
                        <Zap className="h-3.5 w-3.5 text-amber-500 mb-0.5" />
                        <span className="text-lg font-bold font-mono tabular-nums">{stats.wpm}</span>
                        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">WPM</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-md border border-border bg-card/50">
                        <Target className="h-3.5 w-3.5 text-green-500 mb-0.5" />
                        <span className="text-lg font-bold font-mono tabular-nums">{stats.accuracy}%</span>
                        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">ACC</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-md border border-border bg-card/50">
                        <Clock className="h-3.5 w-3.5 text-blue-500 mb-0.5" />
                        <span className="text-lg font-bold font-mono tabular-nums">
                            {Math.floor(stats.elapsedTime / 60)}:{Math.floor(stats.elapsedTime % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Time</span>
                    </div>
                </div>

                {/* Typing Area */}
                <div className="shadow-sm">
                    <TypingArea
                        targetText={targetText}
                        userInput={userInput}
                        onInput={handleInput}
                        disabled={stats.isComplete}
                    />
                </div>
            </div>
        );
    }

    // ===== FINISHED =====
    if (phase === 'finished' || myFinishData) {
        const myData = myFinishData || { ...defaultProgress };
        const oppData = opponentProgress;
        const iWon = myData.wpm > oppData.wpm;
        const isDraw = myData.wpm === oppData.wpm;
        const oppFinished = oppData.finished;

        return (
            <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in zoom-in-95 fade-in duration-500">
                {/* Winner Banner */}
                <div className="text-center space-y-2">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${!oppFinished
                            ? 'bg-amber-500/20 border border-amber-500/30'
                            : iWon
                                ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/40 vs-winner-glow'
                                : isDraw
                                    ? 'bg-secondary border border-border'
                                    : 'bg-blue-500/20 border border-blue-500/30'
                        }`}>
                        {!oppFinished ? (
                            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                        ) : iWon ? (
                            <Crown className="h-8 w-8 text-amber-500" />
                        ) : isDraw ? (
                            <Swords className="h-8 w-8 text-muted-foreground" />
                        ) : (
                            <Trophy className="h-8 w-8 text-blue-500" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold font-mono glitch-text"
                        data-text={!oppFinished ? 'Waiting for opponent...' : iWon ? 'You Win!' : isDraw ? "It's a Draw!" : 'Opponent Wins!'}
                    >
                        {!oppFinished ? 'Waiting for opponent...' : iWon ? 'You Win!' : isDraw ? "It's a Draw!" : 'Opponent Wins!'}
                    </h2>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Your Results */}
                    <div className={`rounded-lg border p-4 space-y-3 ${iWon && oppFinished ? 'border-amber-500/50 bg-amber-500/5' : 'border-border bg-card'}`}>
                        <div className="text-center">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">You</span>
                        </div>
                        <VsStatItem label="WPM" value={myData.wpm} highlight={iWon && oppFinished} />
                        <VsStatItem label="Accuracy" value={`${myData.accuracy}%`} />
                        <VsStatItem label="Correct" value={myData.correctChars} />
                        <VsStatItem label="Errors" value={myData.incorrectChars} />
                        <VsStatItem
                            label="Time"
                            value={`${Math.floor(myData.elapsedTime / 60)}:${Math.floor(myData.elapsedTime % 60).toString().padStart(2, '0')}`}
                        />
                    </div>

                    {/* Opponent Results */}
                    <div className={`rounded-lg border p-4 space-y-3 ${!iWon && !isDraw && oppFinished ? 'border-blue-500/50 bg-blue-500/5' : 'border-border bg-card'}`}>
                        <div className="text-center">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-500">Opponent</span>
                        </div>
                        {oppFinished ? (
                            <>
                                <VsStatItem label="WPM" value={oppData.wpm} highlight={!iWon && !isDraw} />
                                <VsStatItem label="Accuracy" value={`${oppData.accuracy}%`} />
                                <VsStatItem label="Correct" value={oppData.correctChars} />
                                <VsStatItem label="Errors" value={oppData.incorrectChars} />
                                <VsStatItem
                                    label="Time"
                                    value={`${Math.floor(oppData.elapsedTime / 60)}:${Math.floor(oppData.elapsedTime % 60).toString().padStart(2, '0')}`}
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                <span className="text-xs font-mono">Still typing...</span>
                                <span className="text-xs font-mono mt-1">{oppData.progress}% complete</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={handleRematch}
                        className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-mono text-sm rounded-md hover:opacity-90 transition-opacity glitch-hover"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Rematch
                    </button>
                    <button
                        onClick={handleLeave}
                        className="flex items-center gap-2 px-6 py-3 border border-border bg-card text-foreground font-mono text-sm rounded-md hover:bg-secondary transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Leave
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

// Small stat row for results
const VsStatItem = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-mono font-bold tabular-nums ${highlight ? 'text-amber-500' : ''}`}>{value}</span>
    </div>
);

const defaultProgress: PlayerProgress = {
    progress: 0,
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    elapsedTime: 0,
    finished: false,
    finishTime: null,
};

export default VsChallenge;
