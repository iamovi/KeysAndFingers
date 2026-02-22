import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';

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
}

type MessageType = 'progress' | 'ready' | 'start' | 'text' | 'finish' | 'restart-request' | 'restart-ack' | 'ping' | 'pong';

interface PeerMessage {
    type: MessageType;
    payload?: unknown;
    ts?: number; // timestamp for ordering
}

const ROOM_PREFIX = 'kf-vs-';
const HEARTBEAT_INTERVAL = 3000;  // ping every 3s
const HEARTBEAT_TIMEOUT = 10000;  // consider dead after 10s no pong
const JOIN_TIMEOUT = 15000;       // 15s to find room

// ICE servers for reliable cross-country NAT traversal
const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    // Free TURN relay for symmetric NAT traversal
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
];

const PEER_CONFIG = {
    debug: 0 as const,
    config: {
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
    },
};

// ---------- Helpers ----------

const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
};

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

// Runtime type guard for incoming messages
const isValidMessage = (msg: unknown): msg is PeerMessage => {
    if (!msg || typeof msg !== 'object') return false;
    const m = msg as Record<string, unknown>;
    if (typeof m.type !== 'string') return false;
    const validTypes: MessageType[] = ['progress', 'ready', 'start', 'text', 'finish', 'restart-request', 'restart-ack', 'ping', 'pong'];
    return validTypes.includes(m.type as MessageType);
};

const isValidProgress = (p: unknown): p is PlayerProgress => {
    if (!p || typeof p !== 'object') return false;
    const obj = p as Record<string, unknown>;
    return (
        typeof obj.progress === 'number' &&
        typeof obj.wpm === 'number' &&
        typeof obj.accuracy === 'number' &&
        typeof obj.finished === 'boolean'
    );
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
    challengeText: string | null;
}

export const usePeerChallenge = (): UsePeerChallengeReturn => {
    const [phase, setPhase] = useState<VsPhase>('idle');
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [opponentConnected, setOpponentConnected] = useState(false);
    const [opponentProgress, setOpponentProgress] = useState<PlayerProgress>({ ...defaultProgress });
    const [countdown, setCountdown] = useState(3);
    const [error, setError] = useState<string | null>(null);
    const [challengeText, setChallengeText] = useState<string | null>(null);

    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastPongRef = useRef<number>(Date.now());
    const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const phaseRef = useRef<VsPhase>('idle');

    // Keep phaseRef in sync so callbacks can read current phase
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupAll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        try { connRef.current?.close(); } catch { /* ignore */ }
        try { peerRef.current?.destroy(); } catch { /* ignore */ }
        peerRef.current = null;
        connRef.current = null;
    }, [stopHeartbeat]);

    const leaveRoom = useCallback(() => {
        cleanupAll();
        setPhase('idle');
        setRoomCode(null);
        setIsHost(false);
        setOpponentConnected(false);
        setOpponentProgress({ ...defaultProgress });
        setCountdown(3);
        setError(null);
        setChallengeText(null);
    }, [cleanupAll]);

    // ---- Heartbeat / Keepalive ----
    const startHeartbeat = useCallback(() => {
        stopHeartbeat();
        lastPongRef.current = Date.now();

        heartbeatRef.current = setInterval(() => {
            const conn = connRef.current;
            if (!conn || !conn.open) return;

            // Send ping
            try {
                conn.send({ type: 'ping', ts: Date.now() } as PeerMessage);
            } catch { /* ignore send errors */ }

            // Check if opponent is still alive
            const elapsed = Date.now() - lastPongRef.current;
            if (elapsed > HEARTBEAT_TIMEOUT) {
                // Opponent seems dead
                setOpponentConnected(false);
                if (phaseRef.current !== 'idle' && phaseRef.current !== 'finished') {
                    setError('Opponent connection lost. They may have disconnected.');
                }
            }
        }, HEARTBEAT_INTERVAL);
    }, [stopHeartbeat]);

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
        setChallengeText(null);

        if (host) {
            import('@/data/texts').then(({ getRandomText }) => {
                const t = getRandomText('medium');
                setChallengeText(t.text);
                connRef.current?.send({ type: 'text', payload: t.text } as PeerMessage);
                // Both sides synchronize via countdown
                setTimeout(() => startCountdown(), 600);
            });
        }
        // Guest waits for 'text' message to trigger countdown
    }, [startCountdown]);

    // ---- Wire up a DataConnection ----
    const wireConnection = useCallback((conn: DataConnection, host: boolean) => {
        connRef.current = conn;

        conn.on('open', () => {
            setOpponentConnected(true);
            setError(null);

            // Clear join timeout on success
            if (joinTimeoutRef.current) {
                clearTimeout(joinTimeoutRef.current);
                joinTimeoutRef.current = null;
            }

            // Start heartbeat
            startHeartbeat();

            if (host) {
                // Host picks the text and sends it
                import('@/data/texts').then(({ getRandomText }) => {
                    const t = getRandomText('medium');
                    setChallengeText(t.text);
                    conn.send({ type: 'text', payload: t.text } as PeerMessage);
                    // Synchronized start: both sides begin countdown
                    setTimeout(() => startCountdown(), 600);
                });
            }
        });

        conn.on('data', (raw: unknown) => {
            // Validate incoming message
            if (!isValidMessage(raw)) return;
            const msg = raw;

            switch (msg.type) {
                case 'ping':
                    // Respond with pong
                    try { conn.send({ type: 'pong', ts: Date.now() } as PeerMessage); } catch { /* ignore */ }
                    break;

                case 'pong':
                    lastPongRef.current = Date.now();
                    // If we thought opponent was disconnected, restore
                    setOpponentConnected(true);
                    break;

                case 'text':
                    if (typeof msg.payload === 'string' && msg.payload.length > 0) {
                        setChallengeText(msg.payload);
                        // Guest starts countdown when text arrives
                        setTimeout(() => startCountdown(), 600);
                    }
                    break;

                case 'progress':
                    if (isValidProgress(msg.payload)) {
                        setOpponentProgress(msg.payload);
                    }
                    break;

                case 'finish':
                    if (isValidProgress(msg.payload)) {
                        setOpponentProgress(msg.payload);
                    }
                    break;

                case 'restart-request':
                    // Auto-ack then reset
                    try { conn.send({ type: 'restart-ack' } as PeerMessage); } catch { /* ignore */ }
                    handleRematchStart(host);
                    break;

                case 'restart-ack':
                    handleRematchStart(host);
                    break;
            }
        });

        conn.on('close', () => {
            setOpponentConnected(false);
            stopHeartbeat();
            if (phaseRef.current !== 'idle') {
                setError('Opponent disconnected.');
                setPhase('lobby');
            }
        });

        conn.on('error', (err) => {
            console.warn('[VS] Connection error:', err);
            setError(`Connection error: ${err.message}`);
        });
    }, [startHeartbeat, stopHeartbeat, startCountdown, handleRematchStart]);

    // ---- Create Room (Host) ----
    const createRoom = useCallback(() => {
        setError(null);
        const code = generateCode();
        const peerId = ROOM_PREFIX + code;
        setRoomCode(code);
        setIsHost(true);
        setPhase('lobby');

        const peer = new Peer(peerId, PEER_CONFIG);
        peerRef.current = peer;

        peer.on('open', () => {
            // Waiting for opponent to connect
        });

        peer.on('connection', (conn) => {
            wireConnection(conn, true);
        });

        peer.on('error', (err) => {
            if (err.type === 'unavailable-id') {
                setError('Room code collision. Please try again.');
                peer.destroy();
                setPhase('idle');
            } else if (err.type === 'network') {
                setError('Network error. Please check your internet connection.');
            } else if (err.type === 'server-error') {
                setError('Signaling server is unavailable. Please try again later.');
            } else {
                setError(`Connection error: ${err.message}`);
            }
        });

        peer.on('disconnected', () => {
            // Try to reconnect to signaling server
            if (!peer.destroyed) {
                try { peer.reconnect(); } catch { /* ignore */ }
            }
        });
    }, [wireConnection]);

    // ---- Join Room (Guest) ----
    const joinRoom = useCallback((code: string) => {
        const trimmed = code.toUpperCase().trim();
        if (trimmed.length < 4) {
            setError('Please enter a valid room code.');
            return;
        }

        setError(null);
        const targetId = ROOM_PREFIX + trimmed;
        setRoomCode(trimmed);
        setIsHost(false);
        setPhase('lobby');

        const peer = new Peer(undefined, PEER_CONFIG);
        peerRef.current = peer;

        // Timeout: if we can't connect within JOIN_TIMEOUT, show error
        joinTimeoutRef.current = setTimeout(() => {
            if (phaseRef.current === 'lobby' && !connRef.current?.open) {
                setError('Could not connect to room. The host may have left or the code is wrong.');
            }
        }, JOIN_TIMEOUT);

        peer.on('open', () => {
            const conn = peer.connect(targetId, { reliable: true });
            wireConnection(conn, false);
        });

        peer.on('error', (err) => {
            if (joinTimeoutRef.current) {
                clearTimeout(joinTimeoutRef.current);
                joinTimeoutRef.current = null;
            }
            if (err.type === 'peer-unavailable') {
                setError('Room not found. Check the code and try again.');
            } else if (err.type === 'network') {
                setError('Network error. Please check your internet connection.');
            } else if (err.type === 'server-error') {
                setError('Signaling server is unavailable. Please try again later.');
            } else {
                setError(`Connection error: ${err.message}`);
            }
        });

        peer.on('disconnected', () => {
            if (!peer.destroyed) {
                try { peer.reconnect(); } catch { /* ignore */ }
            }
        });
    }, [wireConnection]);

    // ---- Send progress update (throttled — called by parent on each keystroke) ----
    const sendProgress = useCallback((p: PlayerProgress) => {
        const conn = connRef.current;
        if (!conn || !conn.open) return;
        try {
            conn.send({ type: 'progress', payload: p, ts: Date.now() } as PeerMessage);
        } catch { /* ignore send failures mid-race */ }
    }, []);

    // ---- Send finish ----
    const sendFinish = useCallback((p: PlayerProgress) => {
        const conn = connRef.current;
        if (!conn || !conn.open) return;
        try {
            conn.send({ type: 'finish', payload: p, ts: Date.now() } as PeerMessage);
        } catch { /* ignore */ }
        setPhase('finished');
    }, []);

    // ---- Request rematch ----
    const requestRematch = useCallback(() => {
        const conn = connRef.current;
        if (!conn || !conn.open) {
            setError('Opponent is no longer connected.');
            return;
        }
        try {
            conn.send({ type: 'restart-request' } as PeerMessage);
        } catch {
            setError('Failed to send rematch request.');
        }
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
        challengeText,
    };
};
