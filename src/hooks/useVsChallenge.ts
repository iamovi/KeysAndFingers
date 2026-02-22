import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// ---------- Types ----------
export type VsPhase = 'idle' | 'lobby' | 'countdown' | 'racing' | 'finished';

export interface PlayerProgress {
    progress: number;   // 0-100
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
    elapsedTime: number;
    finished: boolean;
    finishTime: number | null;
    name?: string;
}

type MessageType = 'ping' | 'pong' | 'text' | 'progress' | 'finish' | 'restart-request' | 'restart-ack' | 'left' | 'ready' | 'reward';

interface VSMessage {
    type: MessageType;
    payload?: any;
    senderId: string;
}

const HEARTBEAT_INTERVAL = 3000;
const HEARTBEAT_TIMEOUT = 10000;
const JOIN_TIMEOUT = 15000;

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

// Generate a random 6-char alphanumeric code
const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
};

// ---------- Hook ----------

export interface UsePeerChallengeReturn {
    phase: VsPhase;
    roomCode: string | null;
    isHost: boolean;
    opponentConnected: boolean;
    opponentProgress: PlayerProgress;
    countdown: number;
    error: string | null;
    createRoom: () => void;
    joinRoom: (code: string) => void;
    sendProgress: (p: PlayerProgress) => void;
    sendFinish: (p: PlayerProgress) => void;
    requestRematch: () => void;
    leaveRoom: () => void;
    setReady: () => void;
    sendReward: (url: string) => void;
    setPlayerName: (name: string) => void;
    resetPlayerName: () => void;
    isReady: boolean;
    isOpponentReady: boolean;
    challengeText: string | null;
    opponentName: string | null;
    playerName: string | null;
    rewardUrl: string | null;
}

export const useVsChallenge = (): UsePeerChallengeReturn => {
    const [phase, setPhase] = useState<VsPhase>('idle');
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [opponentConnected, setOpponentConnected] = useState(false);
    const [opponentProgress, setOpponentProgress] = useState<PlayerProgress>({ ...defaultProgress });
    const [opponentName, setOpponentName] = useState<string | null>(null);
    const [playerName, setPlayerNameState] = useState<string | null>(() => localStorage.getItem('kf_vs_player_name'));
    const [countdown, setCountdown] = useState(3);
    const [error, setError] = useState<string | null>(null);
    const [challengeText, setChallengeText] = useState<string | null>(null);
    const [isReady, setIsReadyState] = useState(false);
    const [isOpponentReady, setIsOpponentReady] = useState(false);
    const [rewardUrl, setRewardUrl] = useState<string | null>(null);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const myId = useRef<string>(Math.random().toString(36).substring(7));
    const opponentId = useRef<string | null>(null);

    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastPongRef = useRef<number>(Date.now());
    const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const phaseRef = useRef<VsPhase>('idle');
    const playerNameRef = useRef<string | null>(playerName);
    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

    // Cleanup on unmount & handle tab close
    useEffect(() => {
        const handleTabClose = () => {
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'vs',
                    payload: { type: 'left', senderId: myId.current } as VSMessage
                });
            }
        };

        window.addEventListener('beforeunload', handleTabClose);

        return () => {
            window.removeEventListener('beforeunload', handleTabClose);
            cleanupAll();
        };
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    const cleanupAll = useCallback(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
        stopHeartbeat();
        if (channelRef.current) {
            // Broadcast that we're leaving
            channelRef.current.send({
                type: 'broadcast',
                event: 'vs',
                payload: { type: 'left', senderId: myId.current } as VSMessage
            });
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }
        opponentId.current = null;
    }, [stopHeartbeat]);

    const leaveRoom = useCallback(() => {
        cleanupAll();
        setPhase('idle');
        setRoomCode(null);
        setIsHost(false);
        setOpponentConnected(false);
        setOpponentProgress({ ...defaultProgress });
        setIsReadyState(false);
        setIsOpponentReady(false);
        setOpponentName(null);
        setError(null);
        setChallengeText(null);
        setRewardUrl(null);
    }, [cleanupAll]);

    const setPlayerName = useCallback((name: string) => {
        const trimmed = name.trim();
        if (trimmed) {
            localStorage.setItem('kf_vs_player_name', trimmed);
            setPlayerNameState(trimmed);
        }
    }, []);

    const resetPlayerName = useCallback(() => {
        localStorage.removeItem('kf_vs_player_name');
        setPlayerNameState(null);
    }, []);

    // ---- Heartbeat ----
    const startHeartbeat = useCallback(() => {
        stopHeartbeat();
        lastPongRef.current = Date.now();

        heartbeatRef.current = setInterval(() => {
            if (!channelRef.current) return;

            // Broadcast ping with our name
            channelRef.current.send({
                type: 'broadcast',
                event: 'vs',
                payload: { type: 'ping', senderId: myId.current, payload: playerNameRef.current } as VSMessage
            });

            // Check timeout
            if (Date.now() - lastPongRef.current > HEARTBEAT_TIMEOUT) {
                if (opponentConnected) {
                    setOpponentConnected(false);
                    setIsOpponentReady(false);
                    if (phaseRef.current !== 'idle' && phaseRef.current !== 'finished') {
                        setError('Opponent connection lost.');
                        if (phaseRef.current === 'racing' || phaseRef.current === 'countdown') {
                            if (countdownRef.current) clearInterval(countdownRef.current);
                            countdownRef.current = null;
                            setPhase('lobby');
                        }
                    }
                }
            }
        }, HEARTBEAT_INTERVAL);
    }, [stopHeartbeat]); // Removed opponentConnected from deps to prevent loop

    // ---- Countdown ----
    const startCountdown = useCallback(() => {
        setPhase('countdown');
        setCountdown(3);
        let c = 3;
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            c -= 1;
            setCountdown(c);
            if (c <= 0) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                countdownRef.current = null;
                setPhase('racing');
            }
        }, 1000);
    }, []);

    // ---- Rematch ----
    const handleRematchStart = useCallback((host: boolean) => {
        setOpponentProgress({ ...defaultProgress });
        setIsReadyState(false);
        setIsOpponentReady(false);
        setChallengeText(null);
        setPhase('lobby');

        if (host) {
            import('@/data/texts').then(({ getRandomText }) => {
                const t = getRandomText('medium');
                setChallengeText(t.text);
                channelRef.current?.send({
                    type: 'broadcast',
                    event: 'vs',
                    payload: { type: 'text', payload: t.text, senderId: myId.current } as VSMessage
                });
            });
        }
    }, []);

    const setReady = useCallback(() => {
        if (!channelRef.current || phaseRef.current !== 'lobby' || !opponentConnected) return;
        setIsReadyState(true);
        channelRef.current.send({
            type: 'broadcast',
            event: 'vs',
            payload: { type: 'ready', senderId: myId.current } as VSMessage
        });
    }, [opponentConnected]);

    // Check if both are ready to start countdown
    useEffect(() => {
        if (isReady && isOpponentReady && phase === 'lobby' && challengeText && opponentConnected) {
            const timer = setTimeout(() => {
                if (phaseRef.current === 'lobby' && opponentConnected) {
                    startCountdown();
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isReady, isOpponentReady, phase, challengeText, opponentConnected, startCountdown]);

    // ---- Setup Channel ----
    const setupChannel = useCallback((code: string, host: boolean) => {
        cleanupAll();
        setError(null);
        setRoomCode(code);
        setIsHost(host);
        setPhase('lobby');

        const channel = supabase.channel(`vs-room-${code}`, {
            config: {
                broadcast: { self: false }
            }
        });

        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'vs' }, ({ payload }: { payload: VSMessage }) => {
                if (payload.senderId === myId.current) return;

                // Remember opponent ID on first message
                if (!opponentId.current) opponentId.current = payload.senderId;

                // Update heartbeat
                lastPongRef.current = Date.now();
                setOpponentConnected(true);
                if (payload.type === 'ping' || payload.type === 'pong') {
                    if (payload.payload && typeof payload.payload === 'string') {
                        setOpponentName(payload.payload);
                    }
                }

                switch (payload.type) {
                    case 'ping':
                        channel.send({
                            type: 'broadcast',
                            event: 'vs',
                            payload: { type: 'pong', senderId: myId.current, payload: playerNameRef.current } as VSMessage
                        });
                        break;

                    case 'pong':
                        // Already handled by common logic above
                        break;

                    case 'text':
                        if (payload.payload) {
                            setChallengeText(payload.payload);
                        }
                        break;

                    case 'progress':
                        setOpponentProgress(payload.payload);
                        break;

                    case 'finish':
                        setOpponentProgress(payload.payload);
                        break;

                    case 'restart-request':
                        channel.send({
                            type: 'broadcast',
                            event: 'vs',
                            payload: { type: 'restart-ack', senderId: myId.current } as VSMessage
                        });
                        handleRematchStart(host);
                        break;

                    case 'restart-ack':
                        handleRematchStart(host);
                        break;

                    case 'ready':
                        setIsOpponentReady(true);
                        break;

                    case 'reward':
                        setRewardUrl(payload.payload);
                        break;

                    case 'left':
                        setOpponentConnected(false);
                        setIsOpponentReady(false);
                        setIsReadyState(false);
                        opponentId.current = null;
                        if (phaseRef.current !== 'idle') {
                            setError('Opponent has left the room.');
                            if (countdownRef.current) clearInterval(countdownRef.current);
                            countdownRef.current = null;
                            if (phaseRef.current === 'racing' || phaseRef.current === 'countdown') {
                                setPhase('lobby');
                            }
                        }
                        break;
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    startHeartbeat();

                    if (host) {
                        // Wait for joiner. Host picks text only when joiner pings or after a bit.
                        // For simple VS, host can broadcast text immediately if they want, 
                        // but better to wait for opponent connected.
                    } else {
                        // Joiner pings to show they are here
                        channel.send({
                            type: 'broadcast',
                            event: 'vs',
                            payload: { type: 'ping', senderId: myId.current, payload: playerNameRef.current } as VSMessage
                        });

                        // Timeout if no response from host
                        joinTimeoutRef.current = setTimeout(() => {
                            if (phaseRef.current === 'lobby' && !opponentId.current) {
                                setError('Room not found or host is inactive.');
                            }
                        }, JOIN_TIMEOUT);
                    }
                } else if (status === 'CHANNEL_ERROR') {
                    setError('Supabase connection failed.');
                }
            });

        // Host picks text when opponent connects (first ping)
        // We'll watch opponentConnected for this
    }, [cleanupAll, startHeartbeat, startCountdown, handleRematchStart]);

    // Logic to send text after opponent connects
    useEffect(() => {
        if (isHost && opponentConnected && phase === 'lobby' && !challengeText) {
            import('@/data/texts').then(({ getRandomText }) => {
                const t = getRandomText('medium');
                setChallengeText(t.text);
                channelRef.current?.send({
                    type: 'broadcast',
                    event: 'vs',
                    payload: { type: 'text', payload: t.text, senderId: myId.current } as VSMessage
                });
            });
        }
    }, [isHost, opponentConnected, phase, challengeText]);

    const createRoom = useCallback(() => {
        const code = generateCode();
        setupChannel(code, true);
    }, [setupChannel]);

    const joinRoom = useCallback((code: string) => {
        const trimmed = code.toUpperCase().trim();
        if (trimmed.length < 4) {
            setError('Invalid room code.');
            return;
        }
        setupChannel(trimmed, false);
    }, [setupChannel]);

    const sendProgress = useCallback((p: PlayerProgress) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'vs',
            payload: { type: 'progress', payload: p, senderId: myId.current } as VSMessage
        });
    }, []);

    const sendFinish = useCallback((p: PlayerProgress) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'vs',
            payload: { type: 'finish', payload: p, senderId: myId.current } as VSMessage
        });
        setPhase('finished');
    }, []);

    const requestRematch = useCallback(() => {
        if (!opponentConnected) {
            setError('Opponent not connected.');
            return;
        }
        channelRef.current?.send({
            type: 'broadcast',
            event: 'vs',
            payload: { type: 'restart-request', senderId: myId.current } as VSMessage
        });
    }, [opponentConnected]);

    const sendReward = useCallback((url: string) => {
        setRewardUrl(url);
        channelRef.current?.send({
            type: 'broadcast',
            event: 'vs',
            payload: { type: 'reward', payload: url, senderId: myId.current } as VSMessage
        });
    }, []);

    return {
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
    };
};
