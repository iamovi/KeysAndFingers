import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DifficultySelector from '@/components/DifficultySelector';
import TypingArea from '@/components/TypingArea';
import StatsBar from '@/components/StatsBar';
import ResultsPanel from '@/components/ResultsPanel';
import HistoryPanel from '@/components/HistoryPanel';
import AboutPanel from '@/components/AboutPanel';
import KeyboardHeatmap from '@/components/KeyboardHeatmap';
import KeyboardPreview from '@/components/KeyboardPreview';
import VsChallenge from '@/components/VsChallenge';
import GCLobby from '@/components/GCLobby';
import { useTypingGame } from '@/hooks/useTypingGame';
import { useLocalStats } from '@/hooks/useLocalStats';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHistory } from '@/hooks/useHistory';
import { getRandomText, getTextCount } from '@/data/texts';
import { RotateCcw, Shuffle, ClipboardPaste, Palette, Swords, Grid3X3, Sparkles, Zap } from 'lucide-react';
import ThemeCustomizer, { CustomThemeSettings } from '@/components/ThemeCustomizer';

const THEME_OPTIONS = ['light', 'dark', 'matrix', 'cyberpink', 'retro', 'midnight', 'nord', 'aurora', 'animate', 'custom'] as const;
type ThemeName = (typeof THEME_OPTIONS)[number];
const isThemeName = (value: string): value is ThemeName => THEME_OPTIONS.includes(value as ThemeName);

const Index = () => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'custom'>('medium');
  const [mode, setMode] = useState<'standard' | 'timed'>('standard');
  const [timerDuration, setTimerDuration] = useState(30);
  const [currentText, setCurrentText] = useState(() => getRandomText('medium'));
  const [isNewBest, setIsNewBest] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timedComplete, setTimedComplete] = useState(false);
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toggles
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('keysfingers_sound');
    return saved !== null ? saved === 'true' : true;
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showVs, setShowVs] = useState(false);
  const [showGC, setShowGC] = useState(false);
  const [showBattleIntro, setShowBattleIntro] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(() => {
    const saved = localStorage.getItem('keysfingers_keyboard');
    return saved !== null ? saved === 'true' : true;
  });
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('keysfingers_theme');
    if (saved && isThemeName(saved)) return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customThemeSettings, setCustomThemeSettings] = useState<CustomThemeSettings | undefined>(() => {
    const saved = localStorage.getItem('kf_custom_theme_settings');
    return saved ? JSON.parse(saved) : undefined;
  });

  const [playerName, setPlayerName] = useState<string | null>(() => localStorage.getItem('kf_vs_player_name'));

  const handlePlayerNameChange = (name: string) => {
    localStorage.setItem('kf_vs_player_name', name);
    setPlayerName(name);
  };

  const handlePlayerNameReset = () => {
    localStorage.removeItem('kf_vs_player_name');
    setPlayerName(null);
  };

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-matrix', 'theme-cyberpink', 'theme-retro', 'theme-midnight', 'theme-nord', 'theme-aurora', 'theme-animate', 'theme-custom');

    const hexToHsl = (hex: string): string => {
      if (!hex || typeof hex !== 'string') return '0 0% 0%';
      let r = 0, g = 0, b = 0;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      } else {
        return '0 0% 0%';
      }
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    if (theme === 'custom' && customThemeSettings) {
      root.classList.add('dark', 'theme-custom');
      root.style.setProperty('--custom-background', hexToHsl(customThemeSettings.background || '#0a0a0a'));
      root.style.setProperty('--custom-foreground', hexToHsl(customThemeSettings.foreground || '#e5e5e5'));
      root.style.setProperty('--custom-primary', hexToHsl(customThemeSettings.primary || '#3b82f6'));
      root.style.setProperty('--custom-secondary', hexToHsl(customThemeSettings.secondary || '#1a1a1a'));
      root.style.setProperty('--custom-accent', hexToHsl(customThemeSettings.accent || '#2563eb'));
      root.style.setProperty('--custom-border', hexToHsl(customThemeSettings.border || '#262626'));
      root.style.setProperty('--custom-error', hexToHsl(customThemeSettings.error || '#ef4444'));
      root.style.setProperty('--custom-caret', hexToHsl(customThemeSettings.caret || '#3b82f6'));
      root.style.setProperty('--custom-font', customThemeSettings.font || 'JetBrains Mono');
      root.style.setProperty('--custom-font-size', `${customThemeSettings.fontSize || 16}px`);
      root.style.setProperty('--custom-letter-spacing', `${customThemeSettings.letterSpacing || 0}px`);
      root.style.setProperty('--custom-blur', `${customThemeSettings.blur || 0}px`);

      // Load font if it's a Google Font
      const googleFonts = ['JetBrains Mono', 'Space Grotesk', 'Inter', 'Roboto Mono'];
      const selectedFont = customThemeSettings.font || 'JetBrains Mono';
      if (googleFonts.includes(selectedFont)) {
        const fontId = `google-font-${selectedFont.replace(/\s+/g, '-').toLowerCase()}`;
        if (!document.getElementById(fontId)) {
          const link = document.createElement('link');
          link.id = fontId;
          link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      }
    } else {
      root.style.removeProperty('--custom-error');
      root.style.removeProperty('--custom-caret');
      root.style.removeProperty('--custom-font-size');
      root.style.removeProperty('--custom-letter-spacing');
      root.style.removeProperty('--custom-blur');
      root.style.removeProperty('--custom-background');
      root.style.removeProperty('--custom-foreground');
      root.style.removeProperty('--custom-primary');
      root.style.removeProperty('--custom-secondary');
      root.style.removeProperty('--custom-accent');
      root.style.removeProperty('--custom-border');
      root.style.removeProperty('--custom-font');

      if (theme !== 'light') {
        root.classList.add('dark');
        if (theme !== 'dark') {
          root.classList.add(`theme-${theme}`);
        }
      }
    }

    localStorage.setItem('keysfingers_theme', theme);
  }, [theme, customThemeSettings]);

  const { stats, userInput, handleInput, reset, targetText } = useTypingGame(currentText.text);
  const { personalBest, streak, saveResult } = useLocalStats();
  const { playKeystroke, playError, playComplete, playMilestone } = useSoundEffects(soundEnabled);
  const { history, addEntry, clearHistory, aggregatedMistyped } = useHistory();

  const prevInputLen = useRef(0);
  const completionHandledRef = useRef(false);
  const isComplete = mode === 'standard' ? stats.isComplete : timedComplete;

  // Sound toggle persist
  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('keysfingers_sound', String(next));
  };

  // Sound effects on typing
  useEffect(() => {
    if (userInput.length > prevInputLen.current) {
      const i = userInput.length - 1;
      if (userInput[i] === currentText.text[i]) {
        playKeystroke();
      } else {
        playError();
      }
      // Milestone every 25%
      const progress = Math.round((userInput.length / currentText.text.length) * 100);
      const prevProgress = Math.round((prevInputLen.current / currentText.text.length) * 100);
      if (Math.floor(progress / 25) > Math.floor(prevProgress / 25) && progress < 100) {
        playMilestone();
      }
    }
    prevInputLen.current = userInput.length;
  }, [currentText.text, playError, playKeystroke, playMilestone, userInput]);

  // Completion sound
  useEffect(() => {
    if (!isComplete || stats.wpm <= 0) {
      completionHandledRef.current = false;
      return;
    }
    if (completionHandledRef.current) return;

    completionHandledRef.current = true;
    playComplete();
    const wasNewBest = !personalBest || stats.wpm > personalBest.wpm;
    setIsNewBest(wasNewBest);
    saveResult(stats.wpm, stats.accuracy, difficulty);
    addEntry({
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      difficulty,
      mode,
      correctChars: stats.correctChars,
      incorrectChars: stats.incorrectChars,
      elapsedTime: stats.elapsedTime,
      mistypedChars: stats.mistypedChars,
    });
  }, [
    addEntry,
    difficulty,
    isComplete,
    mode,
    personalBest,
    playComplete,
    saveResult,
    stats.accuracy,
    stats.correctChars,
    stats.elapsedTime,
    stats.incorrectChars,
    stats.mistypedChars,
    stats.wpm,
  ]);

  const loadNewText = useCallback((d: 'easy' | 'medium' | 'hard' | 'custom') => {
    if (d === 'custom') return;
    setCurrentText(getRandomText(d));
  }, []);

  const handleDifficultyChange = (d: 'easy' | 'medium' | 'hard' | 'custom') => {
    setDifficulty(d);
    if (d === 'custom') {
      setShowCustomInput(true);
      return;
    }
    setShowCustomInput(false);
    const newText = getRandomText(d);
    setCurrentText(newText);
    reset();
    setIsNewBest(false);
    setTimeRemaining(null);
    setTimedComplete(false);
    prevInputLen.current = 0;
    completionHandledRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCustomStart = () => {
    const trimmed = customText.trim();
    if (trimmed.length < 10) return;
    setCurrentText({ text: trimmed, difficulty: 'custom' });
    setShowCustomInput(false);
    reset();
    setIsNewBest(false);
    setTimeRemaining(null);
    setTimedComplete(false);
    prevInputLen.current = 0;
    completionHandledRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleNextText = () => {
    if (difficulty === 'custom') {
      setShowCustomInput(true);
      return;
    }
    loadNewText(difficulty);
    reset();
    setIsNewBest(false);
    setTimeRemaining(null);
    setTimedComplete(false);
    prevInputLen.current = 0;
    completionHandledRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleModeChange = (m: 'standard' | 'timed') => {
    setMode(m);
    handleRestart();
  };

  // Timer mode
  useEffect(() => {
    if (mode === 'timed' && stats.isStarted && !timedComplete) {
      setTimeRemaining(timerDuration);
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev !== null && prev <= 1) {
            setTimedComplete(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stats.isStarted, mode, timerDuration, timedComplete]);

  const handleRestart = useCallback(() => {
    reset();
    loadNewText(difficulty);
    setIsNewBest(false);
    setTimeRemaining(null);
    setTimedComplete(false);
    prevInputLen.current = 0;
    completionHandledRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  }, [difficulty, loadNewText, reset]);

  // Keyboard shortcut: Esc to reset or close views
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showHistory || showHeatmap || showAbout) {
          setShowHistory(false);
          setShowHeatmap(false);
          setShowAbout(false);
        } else {
          handleRestart();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleRestart, showHeatmap, showHistory, showAbout]);

  const handleGCToggle = () => {
    const next = !showGC;
    setShowGC(next);
    if (next) {
      setShowVs(false);
      setShowHistory(false);
      setShowHeatmap(false);
      setShowAbout(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background scanline">
      <Header
        soundEnabled={soundEnabled}
        onSoundToggle={handleSoundToggle}
        showHistory={showHistory}
        onHistoryToggle={() => {
          setShowHistory(p => !p);
          setShowHeatmap(false);
          setShowVs(false);
          setShowGC(false);
          setShowAbout(false);
        }}
        showHeatmap={showHeatmap}
        onHeatmapToggle={() => {
          setShowHeatmap(p => !p);
          setShowHistory(false);
          setShowVs(false);
          setShowGC(false);
          setShowAbout(false);
        }}
        showAbout={showAbout}
        onAboutToggle={() => {
          setShowAbout(p => !p);
          setShowHistory(false);
          setShowHeatmap(false);
          setShowVs(false);
          setShowGC(false);
        }}
        showKeyboard={showKeyboard}
        onKeyboardToggle={() => {
          const next = !showKeyboard;
          setShowKeyboard(next);
          localStorage.setItem('keysfingers_keyboard', String(next));
        }}
        theme={theme}
        onThemeChange={setTheme}
        showVs={showVs}
        onVsToggle={() => {
          const enteringVs = !showVs;
          setShowVs(enteringVs);
          setShowHistory(false);
          setShowHeatmap(false);
          setShowGC(false);
          setShowAbout(false);

          if (enteringVs) {
            setShowBattleIntro(true);
          }
        }}
        showGC={showGC}
        onGCToggle={handleGCToggle}
        onCustomizerToggle={() => setShowCustomizer(true)}
      />

      {showBattleIntro && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-start lg:justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500 p-3 sm:p-6 overflow-y-auto">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 max-w-7xl w-full py-4 lg:py-8">

            {/* Left Info Panel */}
            <div className="w-full lg:w-72 order-2 lg:order-1 space-y-4 lg:space-y-6 animate-in slide-in-from-left duration-700 delay-200">
              <div className="space-y-1 lg:space-y-2 border-l-2 border-amber-500 pl-4 py-1 lg:py-2 bg-amber-500/5">
                <h3 className="text-amber-500 font-mono font-bold uppercase tracking-[0.2em] text-[10px] lg:text-sm">Rules of Combat</h3>
                <p className="text-[10px] lg:text-[11px] font-mono text-muted-foreground leading-relaxed">
                  Fastest finish wins. Speed & precision are key.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-4">
                <div className="group p-2 lg:p-3 border border-border bg-secondary/20 rounded hover:border-amber-500/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Swords className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-amber-500" />
                    <span className="text-[9px] lg:text-[10px] font-mono font-bold uppercase tracking-wider">Sync</span>
                  </div>
                  <p className="text-[8px] lg:text-[9px] font-mono text-muted-foreground">Real-time progress.</p>
                </div>

                <div className="group p-2 lg:p-3 border border-border bg-secondary/20 rounded hover:border-amber-500/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1 text-sky-400">
                    <Grid3X3 className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                    <span className="text-[9px] lg:text-[10px] font-mono font-bold uppercase tracking-wider">Rooms</span>
                  </div>
                  <p className="text-[8px] lg:text-[9px] font-mono text-muted-foreground">Challenge friends.</p>
                </div>
              </div>
            </div>

            {/* Central GIF & Action Box */}
            <div className="relative order-1 lg:order-2 w-full max-w-2xl">
              <div className="relative overflow-hidden rounded-xl lg:rounded-2xl border-2 lg:border-4 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.3)] lg:shadow-[0_0_80px_rgba(245,158,11,0.4)] bg-black">
                <img
                  src={`battle.gif?t=${Date.now()}`}
                  alt="BATTLE START"
                  className="w-full h-auto max-h-[40vh] lg:max-h-full object-contain opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black flex flex-col justify-between p-4 lg:p-10">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0 lg:gap-1">
                      <div className="px-2 lg:px-3 py-0.5 lg:py-1 bg-amber-500 text-black text-[8px] lg:text-[10px] font-mono font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] skew-x-[-12deg]">
                        CHALLENGE
                      </div>
                      <div className="text-[8px] lg:text-[9px] font-mono text-amber-500/80 tracking-widest uppercase mt-0.5 lg:mt-1">
                        status: ready
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center items-center flex-col gap-4 lg:gap-8">
                    <div className="text-center">
                      <h1 className="text-4xl lg:text-8xl font-mono font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] animate-pulse mb-1 lg:mb-2">
                        VERSUS
                      </h1>
                      <div className="flex items-center justify-center gap-2 lg:gap-4 text-amber-500 font-mono text-[8px] lg:text-[10px] tracking-[0.3em] lg:tracking-[0.5em] font-bold">
                        <span className="w-4 lg:w-8 h-[1px] bg-amber-500/30"></span>
                        ENGAGE
                        <span className="w-4 lg:w-8 h-[1px] bg-amber-500/30"></span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowBattleIntro(false)}
                      className="group relative px-8 lg:px-16 py-3 lg:py-5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xl lg:text-3xl uppercase tracking-[0.1em] lg:tracking-[0.2em] skew-x-[-12deg] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.5)] lg:shadow-[0_0_40px_rgba(245,158,11,0.7)]"
                    >
                      <span className="relative z-10 flex items-center gap-2 lg:gap-3">
                        GO! <Swords className="h-4 w-4 lg:h-6 lg:w-6" />
                      </span>
                      <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="text-[8px] lg:text-[9px] font-mono text-muted-foreground uppercase vertical-text tracking-widest hidden sm:block">
                      v2.0
                    </div>
                    <div className="px-2 lg:px-3 py-0.5 lg:py-1 bg-amber-500 text-black text-[8px] lg:text-[10px] font-mono font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] skew-x-[-12deg]">
                      FIGHT!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Info Panel */}
            <div className="w-full lg:w-72 order-3 space-y-4 lg:space-y-6 animate-in slide-in-from-right duration-700 delay-200">
              <div className="space-y-1 lg:space-y-2 border-r-2 border-amber-500 pr-4 py-1 lg:py-2 bg-amber-500/5 text-right">
                <h3 className="text-amber-500 font-mono font-bold uppercase tracking-[0.2em] text-[10px] lg:text-sm">Rewards</h3>
                <p className="text-[10px] lg:text-[11px] font-mono text-muted-foreground leading-relaxed">
                  Victory grants the legendary spoils.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-4">
                <div className="group p-2 lg:p-3 border border-border bg-secondary/20 rounded hover:border-amber-500/50 transition-colors text-right">
                  <div className="flex items-center justify-end gap-2 mb-1 text-pink-500">
                    <span className="text-[9px] lg:text-[10px] font-mono font-bold uppercase tracking-wider">Art</span>
                    <Sparkles className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                  </div>
                  <p className="text-[8px] lg:text-[9px] font-mono text-muted-foreground">Unlock spoils.</p>
                </div>

                <div className="group p-2 lg:p-3 border border-border bg-secondary/20 rounded hover:border-amber-500/50 transition-colors text-right">
                  <div className="flex items-center justify-end gap-2 mb-1 text-amber-500">
                    <span className="text-[9px] lg:text-[10px] font-mono font-bold uppercase tracking-wider">Items</span>
                    <Zap className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                  </div>
                  <p className="text-[8px] lg:text-[9px] font-mono text-muted-foreground">Coming soon.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-4 lg:mt-8 text-center animate-in fade-in duration-1000 delay-500">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.4em] animate-pulse">
              [ WAITING ]
            </p>
          </div>
        </div>
      )}

      {showCustomizer && (
        <ThemeCustomizer
          onClose={() => setShowCustomizer(false)}
          onSave={(settings) => {
            setCustomThemeSettings(settings);
            localStorage.setItem('kf_custom_theme_settings', JSON.stringify(settings));
            setTheme('custom');
          }}
          initialSettings={customThemeSettings}
        />
      )}

      <main className="flex-1 container mx-auto px-4 py-1 lg:py-2 max-w-7xl">
        {showVs ? (
          <VsChallenge onExit={() => setShowVs(false)} soundEnabled={soundEnabled} onPlayerNameChange={handlePlayerNameChange} />
        ) : showGC ? (
          <GCLobby
            playerName={playerName}
            onJoin={handlePlayerNameChange}
            onResetName={handlePlayerNameReset}
            onExit={() => setShowGC(false)}
            onJoinVsFromGC={(_roomCode) => {
              // sessionStorage already set by GCLobby before calling this
              setShowGC(false);
              setShowVs(true);
              setShowBattleIntro(false);
            }}
            onCreateChallengeRoom={() => {
              // Just generate and return the code — do NOT switch views here
              // GCLobby will switch views after the broadcast flushes
              const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
              let code = '';
              for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
              return code;
            }}
          />
        ) : showAbout ? (
          <AboutPanel onExit={() => setShowAbout(false)} />
        ) : showHistory ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-mono glitch-text" data-text="Typing History">
                Typing History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 text-xs font-mono rounded-sm bg-secondary text-secondary-foreground hover:bg-accent border border-border transition-all"
              >
                Back to Game (Esc)
              </button>
            </div>
            <HistoryPanel history={history} onClear={clearHistory} />
          </div>
        ) : showHeatmap ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-mono glitch-text" data-text="Keyboard Over Heatmap">
                Keyboard Heatmap
              </h2>
              <button
                onClick={() => setShowHeatmap(false)}
                className="px-4 py-2 text-xs font-mono rounded-sm bg-secondary text-secondary-foreground hover:bg-accent border border-border transition-all"
              >
                Back to Game (Esc)
              </button>
            </div>
            <div className="bg-card border border-border p-8 rounded-md shadow-lg">
              <KeyboardHeatmap mistypedChars={aggregatedMistyped} />
            </div>
            <div className="mt-8 p-4 bg-secondary/20 rounded-md border border-border/50">
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                This heatmap shows which keys you struggle with most. Darker shades indicate more frequent mistakes on those specific keys. Use this to focus your practice on your weak points.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-start">
            {/* Left Column: Controls and Stats (Lower priority on mobile) */}
            <div className="lg:col-span-4 space-y-3 lg:space-y-4 lg:sticky lg:top-2 order-2 lg:order-1">
              <DifficultySelector
                difficulty={difficulty}
                onSelect={handleDifficultyChange}
                mode={mode}
                onModeChange={handleModeChange}
                timerDuration={timerDuration}
                onTimerChange={setTimerDuration}
                disabled={stats.isStarted && !isComplete}
              />

              {!isComplete && (
                <StatsBar
                  stats={stats}
                  personalBest={personalBest}
                  streak={streak}
                  timeRemaining={mode === 'timed' ? timeRemaining : null}
                />
              )}
            </div>

            {/* Right Column: Interaction Area (Top priority on mobile) */}
            <div className="lg:col-span-8 space-y-4 lg:space-y-6 order-1 lg:order-2">
              {showCustomInput ? (
                <div className="space-y-4 rounded-md border border-border bg-card p-4 lg:p-6 shadow-sm">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    Paste your own text (min 10 characters)
                  </label>
                  <textarea
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Paste or type your paragraph here..."
                    className="w-full min-h-[120px] lg:min-h-[160px] rounded-md border border-input bg-background px-3 lg:px-4 py-2 lg:py-3 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-sm">
                    <span className="text-xs text-muted-foreground font-mono">
                      {customText.trim().length} chars
                    </span>
                    <button
                      onClick={handleCustomStart}
                      disabled={customText.trim().length < 10}
                      className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-2.5 text-xs font-mono rounded-sm bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                      Start
                    </button>
                  </div>
                </div>
              ) : !isComplete ? (
                <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      <span className="shrink-0 px-2 py-1 text-[9px] lg:text-[10px] font-mono font-bold uppercase tracking-wider bg-foreground text-background rounded-sm">
                        {difficulty}
                      </span>
                      <span className="shrink-0 text-[9px] lg:text-[10px] font-mono text-muted-foreground bg-secondary/80 px-2 py-1 rounded-sm border border-border/50">
                        {difficulty === 'custom' ? 'User Custom' : `${getTextCount(difficulty)} texts`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {stats.isStarted && (
                        <button
                          onClick={handleRestart}
                          className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <RotateCcw className="h-3 w-3 group-hover:rotate-[-45deg] transition-transform" />
                          <span className="hidden sm:inline">Restart</span>
                        </button>
                      )}
                      <button
                        onClick={handleNextText}
                        disabled={stats.isStarted}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-sm bg-secondary text-secondary-foreground hover:bg-accent border border-border shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Shuffle className="h-3 w-3" />
                        Next
                      </button>
                    </div>
                  </div>

                  <div className="shadow-sm">
                    <TypingArea
                      targetText={targetText}
                      userInput={userInput}
                      onInput={handleInput}
                      disabled={isComplete}
                    />
                  </div>

                  {showKeyboard && (
                    <div className="pt-2 animate-in fade-in duration-700 overflow-hidden">
                      <KeyboardPreview activeChar={userInput.length > 0 ? userInput[userInput.length - 1] : null} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-in zoom-in-95 duration-300">
                  <ResultsPanel stats={stats} onRestart={handleRestart} isNewBest={isNewBest} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
