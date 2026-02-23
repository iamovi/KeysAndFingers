import { useState, useEffect, useRef, useCallback } from 'react';
import { useVsChallenge, PlayerProgress } from '@/hooks/useVsChallenge';
import { useTypingGame } from '@/hooks/useTypingGame';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import TypingArea from '@/components/TypingArea';
import { toast } from 'sonner';
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
    Crown,
    Loader2,
} from 'lucide-react';

interface VsChallengeProps {
    onExit: () => void;
    soundEnabled: boolean;
    onPlayerNameChange?: (name: string) => void;
}

type RaceMetrics = Pick<PlayerProgress, 'wpm' | 'accuracy' | 'correctChars' | 'elapsedTime' | 'finishTime'>;

// Winner = finished fastest with valid accuracy (>=70%).
// A finish with <70% accuracy is treated as invalid and loses to any legitimate finish.
const MIN_ACCURACY_TO_FINISH = 70;

const compareRaceMetrics = (left: RaceMetrics, right: RaceMetrics): number => {
    const leftFinished = left.finishTime !== null && left.finishTime !== undefined;
    const rightFinished = right.finishTime !== null && right.finishTime !== undefined;
    const leftValid = leftFinished && left.accuracy >= MIN_ACCURACY_TO_FINISH;
    const rightValid = rightFinished && right.accuracy >= MIN_ACCURACY_TO_FINISH;

    // Both finished legitimately: fastest wins
    if (leftValid && rightValid) {
        const timeDiff = (right.finishTime as number) - (left.finishTime as number);
        if (timeDiff !== 0) return timeDiff; // positive = left finished earlier = left wins
        if (left.wpm !== right.wpm) return left.wpm - right.wpm;
        return left.accuracy - right.accuracy;
    }

    // Only one finished legitimately
    if (leftValid && !rightValid) return 1;
    if (!leftValid && rightValid) return -1;

    // Both finished but both below 70% (two spammers lol): higher accuracy wins
    if (leftFinished && rightFinished) return left.accuracy - right.accuracy;

    // Only left finished (even if invalid)
    if (leftFinished) return 1;
    // Only right finished (even if invalid)
    if (rightFinished) return -1;

    // Neither finished (mid-race): higher WPM, then accuracy, then progress
    if (left.wpm !== right.wpm) return left.wpm - right.wpm;
    if (left.accuracy !== right.accuracy) return left.accuracy - right.accuracy;
    return left.correctChars - right.correctChars;
};

const VsChallenge = ({ onExit, soundEnabled, onPlayerNameChange }: VsChallengeProps) => {
    const {
        phase,
        roomCode,
        isHost,
        opponentConnected,
        opponentProgress,
        countdown,
        error,
        createRoom,
        createRoomWithCode,
        joinRoom,
        sendProgress,
        sendFinish,
        requestRematch,
        leaveRoom,
        setReady,
        sendReward,
        setPlayerName,
        resetPlayerName,
        isReady,
        isOpponentReady,
        challengeText,
        opponentName,
        playerName,
        rewardUrl,
        difficulty,
        setVsDifficulty,
    } = useVsChallenge();

    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [myFinishData, setMyFinishData] = useState<PlayerProgress | null>(null);
    const [nameInput, setNameInput] = useState('');
    const [loadingReward, setLoadingReward] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Auto-join or host from GC lobby challenge
    useEffect(() => {
        const gcJoinCode = sessionStorage.getItem('kf_gc_join_code');
        const gcHostCode = sessionStorage.getItem('kf_gc_host_code');
        if (gcJoinCode) {
            sessionStorage.removeItem('kf_gc_join_code');
            if (playerName) joinRoom(gcJoinCode);
        } else if (gcHostCode) {
            sessionStorage.removeItem('kf_gc_host_code');
            if (playerName) createRoomWithCode(gcHostCode);
        }
    }, [playerName, createRoomWithCode, joinRoom]);

    // Lock the race text once the race starts — never let it change mid-race
    // This prevents correct chars showing as red if challengeText gets disrupted
    const lockedTextRef = useRef<string>('');
    useEffect(() => {
        if (challengeText && (phase === 'lobby' || phase === 'countdown')) {
            lockedTextRef.current = challengeText;
        }
    }, [challengeText, phase]);
    const activeText = phase === 'racing' ? lockedTextRef.current : (challengeText ?? '');
    const { stats, userInput, handleInput, reset, targetText } = useTypingGame(activeText);
    const { playKeystroke, playError, playComplete, playMilestone } = useSoundEffects(soundEnabled);

    const prevInputLen = useRef(0);
    const wasOpponentConnectedRef = useRef(false);

    useEffect(() => {
        if (challengeText) {
            reset();
            setMyFinishData(null);
            prevInputLen.current = 0;
        }
    }, [challengeText, reset]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    useEffect(() => {
        const justConnected = !wasOpponentConnectedRef.current && opponentConnected;
        if (justConnected && phase !== 'idle') {
            toast.success(`${opponentName || 'Opponent'} connected!`);
        }
        wasOpponentConnectedRef.current = opponentConnected;
    }, [opponentConnected, opponentName, phase]);

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
    }, [activeText, phase, playError, playKeystroke, playMilestone, userInput]);

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
    }, [
        phase,
        sendProgress,
        stats.accuracy,
        stats.correctChars,
        stats.elapsedTime,
        stats.incorrectChars,
        stats.isComplete,
        stats.progress,
        stats.wpm,
    ]);

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
    }, [
        myFinishData,
        phase,
        playComplete,
        sendFinish,
        stats.accuracy,
        stats.correctChars,
        stats.elapsedTime,
        stats.incorrectChars,
        stats.isComplete,
        stats.wpm,
    ]);

    const handleCopyCode = useCallback(() => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [roomCode]);

    const handleLeaveRoom = useCallback(() => {
        leaveRoom();
    }, [leaveRoom]);

    const handleBackToSolo = useCallback(() => {
        leaveRoom();
        onExit();
    }, [leaveRoom, onExit]);

    const handleRematch = useCallback(() => {
        setMyFinishData(null);
        reset();
        prevInputLen.current = 0;
        requestRematch();
    }, [requestRematch, reset]);

    const handleSetName = (e: React.FormEvent) => {
        e.preventDefault();
        if (nameInput.trim()) {
            setPlayerName(nameInput.trim());
            if (onPlayerNameChange) onPlayerNameChange(nameInput.trim());
        }
    };

    useEffect(() => {
        const myData = myFinishData || (
            phase === 'finished'
                ? {
                    finished: true,
                    wpm: stats.wpm,
                    accuracy: stats.accuracy,
                    correctChars: stats.correctChars,
                    elapsedTime: stats.elapsedTime,
                }
                : null
        );
        const oppData = opponentProgress;

        if (myData?.finished && oppData.finished && !rewardUrl && !loadingReward) {
            const iWon = compareRaceMetrics(
                {
                    wpm: myData.wpm || 0,
                    accuracy: myData.accuracy || 0,
                    correctChars: myData.correctChars || 0,
                    elapsedTime: myData.elapsedTime || 0,
                    finishTime: (myData as PlayerProgress).finishTime ?? null,
                },
                {
                    wpm: oppData.wpm || 0,
                    accuracy: oppData.accuracy || 0,
                    correctChars: oppData.correctChars || 0,
                    elapsedTime: oppData.elapsedTime || 0,
                    finishTime: oppData.finishTime ?? null,
                }
            ) > 0;
            if (iWon) {
                const fetchReward = async () => {
                    setLoadingReward(true);
                    try {
                        const res = await fetch('https://api.waifu.pics/sfw/waifu');
                        const data = await res.json();
                        if (data.url) {
                            sendReward(data.url);
                        }
                    } catch (err) {
                        console.error('Failed to fetch waifu reward:', err);
                    } finally {
                        setLoadingReward(false);
                    }
                };
                fetchReward();
            }
        }
    }, [
        loadingReward,
        myFinishData,
        opponentProgress,
        phase,
        rewardUrl,
        sendReward,
        stats.accuracy,
        stats.correctChars,
        stats.elapsedTime,
        stats.wpm,
    ]);

    if (!playerName) {
        return (
            <div className="max-w-md mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                        <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold font-mono glitch-text" data-text="Identify Yourself">
                        Identify Yourself
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">
                        Enter a nickname to show your opponent
                    </p>
                </div>

                <form onSubmit={handleSetName} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="YOUR NICKNAME"
                            autoFocus
                            className="w-full text-center text-xl font-mono font-bold uppercase bg-background border-2 border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-all shadow-sm"
                            maxLength={12}
                        />
                        <p className="text-[10px] text-center text-muted-foreground font-mono uppercase tracking-widest">
                            Max 12 characters
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={!nameInput.trim()}
                        className="w-full py-4 bg-primary text-primary-foreground font-mono font-bold rounded-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        START RACING
                    </button>
                    <button
                        type="button"
                        onClick={onExit}
                        className="w-full py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        CANCEL
                    </button>
                </form>
            </div>
        );
    }

    if (phase === 'idle') {
        return (
            <div className="relative max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute top-0 right-0 sm:-right-4">
                    <button
                        onClick={resetPlayerName}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-border hover:bg-secondary transition-colors group"
                        title="Change Name"
                    >
                        <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">PLAYING AS:</span>
                        <span className="text-xs font-mono font-bold text-foreground">{playerName}</span>
                        <span className="text-[10px] font-mono text-primary underline underline-offset-2 transition-opacity">CHANGE</span>
                    </button>
                </div>

                <div className="max-w-lg mx-auto space-y-6 pt-8">
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
                            onClick={handleBackToSolo}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <LogOut className="h-3 w-3" />
                            Back to Solo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'lobby') {
        return (
            <div className="max-w-lg mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold font-mono glitch-text" data-text="Waiting...">
                        {opponentConnected ? `${opponentName || 'Opponent'} Joined!` : `Waiting for ${opponentName || 'Opponent'}...`}
                    </h2>
                </div>

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
                {/* Difficulty Selection */}
                <div className="space-y-3 p-6 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                            Difficulty
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                            difficulty === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                                'bg-red-500/20 text-red-500'
                            } uppercase font-bold`}>
                            {difficulty}
                        </span>
                    </div>

                    {isHost ? (
                        <div className="grid grid-cols-3 gap-2">
                            {(['easy', 'medium', 'hard'] as const).map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setVsDifficulty(d)}
                                    disabled={!opponentConnected}
                                    className={`py-2 text-[10px] font-mono font-bold rounded border transition-all ${difficulty === d
                                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                        : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                                        } ${!opponentConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {d.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full py-2 px-4 bg-secondary/30 border border-border rounded text-center">
                            <span className="text-xs font-mono text-muted-foreground italic">
                                Waiting for host to choose...
                            </span>
                        </div>
                    )}

                    {isHost && !opponentConnected && (
                        <p className="text-[9px] font-mono text-muted-foreground text-center animate-pulse">
                            Connect opponent to change settings
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3 p-4 rounded-lg border border-border bg-card">
                        <div className="flex flex-col items-center gap-2 flex-1">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-muted'} transition-all`} />
                                <span className="text-xs font-mono font-bold truncate max-w-[100px]">{playerName}</span>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isReady ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'}`}>
                                {isReady ? 'READY' : 'NOT READY'}
                            </span>
                        </div>

                        <div className="text-muted-foreground font-mono text-xl italic opacity-30">VS</div>

                        <div className="flex flex-col items-center gap-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold truncate max-w-[100px]">{opponentName || '...'}</span>
                                <div className={`w-3 h-3 rounded-full ${isOpponentReady ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-muted'} transition-all`} />
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isOpponentReady ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'}`}>
                                {isOpponentReady ? 'READY' : 'NOT READY'}
                            </span>
                        </div>
                    </div>

                    {opponentConnected && !isReady && (
                        <button
                            onClick={setReady}
                            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] animate-in fade-in zoom-in-95 duration-300"
                        >
                            CLICK TO READY
                        </button>
                    )}

                    {opponentConnected && isReady && !isOpponentReady && (
                        <div className="w-full py-4 bg-secondary text-muted-foreground font-mono text-xs text-center rounded-lg border border-border italic">
                            Waiting for opponent to ready up...
                        </div>
                    )}
                </div>

                {error && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center">
                        <p className="text-xs font-mono text-destructive">{error}</p>
                    </div>
                )}

                <div className="text-center">
                    <button
                        onClick={handleLeaveRoom}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <LogOut className="h-3 w-3" />
                        Leave Room
                    </button>
                </div>
            </div>
        );
    }

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

    if (phase === 'racing') {
        const myProgress = stats.progress;
        const oppProgress = opponentProgress.progress;

        return (
            <div className="space-y-4 animate-in fade-in duration-300">
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

                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                                {playerName}
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

                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                {opponentName || 'Opponent'}
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

                <div className="shadow-sm">
                    <TypingArea
                        targetText={targetText}
                        userInput={userInput}
                        onInput={handleInput}
                        disabled={stats.isComplete}
                    />
                </div>

                {/* Live accuracy warning during race */}
                {stats.isStarted && (() => {
                    const belowMin = stats.accuracy < 70;
                    const reachedEnd = userInput.length === targetText.length;

                    if (reachedEnd && belowMin) {
                        return (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/40 animate-in fade-in duration-300">
                                <span className="text-xl">❌</span>
                                <div>
                                    <p className="text-sm font-mono font-bold text-destructive">Can't finish the race</p>
                                    <p className="text-xs font-mono text-muted-foreground">Your accuracy is {stats.accuracy}% — need at least 70% to complete</p>
                                </div>
                            </div>
                        );
                    }

                    if (belowMin) {
                        return (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-orange-500/10 border border-orange-500/40 animate-in fade-in duration-300">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <p className="text-sm font-mono font-bold text-orange-400">Accuracy too low — {stats.accuracy}%</p>
                                    <p className="text-xs font-mono text-muted-foreground">You won't finish below 70% — slow down!</p>
                                </div>
                            </div>
                        );
                    }

                    return null;
                })()}
            </div>
        );
    }

    if (phase === 'finished' || myFinishData) {
        const myData = myFinishData || { ...defaultProgress };
        const oppData = opponentProgress;
        const comparison = compareRaceMetrics(myData, oppData);
        const iWon = comparison > 0;
        const isDraw = comparison === 0;
        const oppFinished = oppData.finished;

        return (
            <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in zoom-in-95 fade-in duration-500">
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
                        data-text={!oppFinished ? `Waiting for ${opponentName || 'Opponent'}...` : iWon ? 'You Win!' : isDraw ? "It's a Draw!" : `${opponentName || 'Opponent'} Wins!`}
                    >
                        {!oppFinished ? `Waiting for ${opponentName || 'Opponent'}...` : iWon ? 'You Win!' : isDraw ? "It's a Draw!" : `${opponentName || 'Opponent'} Wins!`}
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-lg border p-4 space-y-3 ${iWon && oppFinished ? 'border-amber-500/50 bg-amber-500/5' : 'border-border bg-card'}`}>
                        <div className="text-center overflow-hidden">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 truncate block">{playerName}</span>
                        </div>
                        <VsStatItem label="WPM" value={myData.wpm} highlight={iWon && oppFinished} />
                        <VsStatItem label="Accuracy" value={myData.accuracy + '%'} />
                        <VsStatItem label="Correct" value={myData.correctChars} />
                        <VsStatItem label="Errors" value={myData.incorrectChars} />
                        <VsStatItem
                            label="Time"
                            value={`${Math.floor(myData.elapsedTime / 60)}:${Math.floor(myData.elapsedTime % 60).toString().padStart(2, '0')}`}
                        />
                    </div>

                    <div className={`rounded-lg border p-4 space-y-3 ${!iWon && !isDraw && oppFinished ? 'border-blue-500/50 bg-blue-500/5' : 'border-border bg-card'}`}>
                        <div className="text-center overflow-hidden">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-500 truncate block">{opponentName || 'Opponent'}</span>
                        </div>
                        {oppFinished ? (
                            <>
                                <VsStatItem label="WPM" value={oppData.wpm} highlight={!iWon && !isDraw} />
                                <VsStatItem label="Accuracy" value={oppData.accuracy + '%'} />
                                <VsStatItem label="Correct" value={oppData.correctChars} />
                                <VsStatItem label="Errors" value={oppData.incorrectChars} />
                                <VsStatItem
                                    label="Time"
                                    value={`${Math.floor(oppData.elapsedTime / 60)}:${Math.floor(oppData.elapsedTime % 60).toString().padStart(2, '0')}`}
                                />
                            </>
                        ) : (() => {
                            const oppStuck = oppData.progress >= 100 && oppData.accuracy < 70;
                            const oppIsSpamming = oppData.accuracy < 70 && oppData.progress > 10;
                            return (
                                <div className="flex flex-col gap-3 py-2">
                                    {/* Live progress bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Progress</span>
                                            <span className="text-xs font-mono font-bold">{oppData.progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={"h-full rounded-full transition-all duration-300 " + (oppIsSpamming ? "bg-destructive" : "bg-blue-500")}
                                                style={{ width: `${oppData.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Live accuracy */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Accuracy</span>
                                        <span className={"text-xs font-mono font-bold " + (oppIsSpamming ? "text-destructive" : "")}>
                                            {oppData.accuracy}%
                                        </span>
                                    </div>

                                    {/* Live WPM */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">WPM</span>
                                        <span className="text-xs font-mono font-bold">{oppData.wpm}</span>
                                    </div>

                                    {/* Spammer warning */}
                                    {oppStuck ? (
                                        <div className="mt-1 flex items-center gap-2 px-2 py-2 rounded bg-destructive/10 border border-destructive/30">
                                            <span className="text-base">⚠️</span>
                                            <div>
                                                <p className="text-[10px] font-mono font-bold text-destructive uppercase tracking-wide">Invalid finish</p>
                                                <p className="text-[9px] font-mono text-muted-foreground">Accuracy too low — can't complete</p>
                                            </div>
                                        </div>
                                    ) : oppIsSpamming ? (
                                        <div className="mt-1 flex items-center gap-2 px-2 py-2 rounded bg-orange-500/10 border border-orange-500/30">
                                            <span className="text-base">🤨</span>
                                            <div>
                                                <p className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wide">Accuracy is cooked</p>
                                                <p className="text-[9px] font-mono text-muted-foreground">Below 70% — won't count as finish</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 pt-1 text-muted-foreground">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            <span className="text-[10px] font-mono">still typing...</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {oppFinished && (
                    <div className="animate-in fade-in zoom-in slide-in-from-top-4 duration-700 delay-300">
                        <div className="p-1 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-red-500">
                            <div className="bg-card rounded-[10px] p-6 space-y-4 text-center">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold font-mono text-foreground uppercase">
                                        WINNER'S REWARD
                                    </h3>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                                        Here is a waifu for {iWon ? playerName : (opponentName || 'Opponent')}
                                    </p>
                                </div>

                                <div className="relative aspect-[4/5] sm:aspect-video w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-border shadow-2xl bg-muted group">
                                    {(loadingReward || !rewardUrl || !imageLoaded) && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted">
                                            {/* Skeleton animation */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-skeleton-shine" />
                                            <Loader2 className="h-8 w-8 text-primary animate-spin relative z-20" />
                                            <span className="text-[10px] font-mono text-muted-foreground animate-pulse relative z-20">SUMMONING WAIFU...</span>
                                        </div>
                                    )}
                                    {rewardUrl && (
                                        <img
                                            src={rewardUrl}
                                            alt="Waifu Reward"
                                            onLoad={() => setImageLoaded(true)}
                                            className={`w-full h-full object-contain sm:object-cover transition-all duration-1000 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                                                }`}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={handleRematch}
                        className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-mono text-sm rounded-md hover:opacity-90 transition-opacity glitch-hover"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Rematch
                    </button>
                    <button
                        onClick={handleLeaveRoom}
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
