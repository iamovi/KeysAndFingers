import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DifficultySelector from '@/components/DifficultySelector';
import TypingArea from '@/components/TypingArea';
import StatsBar from '@/components/StatsBar';
import ResultsPanel from '@/components/ResultsPanel';
import HistoryPanel from '@/components/HistoryPanel';
import KeyboardHeatmap from '@/components/KeyboardHeatmap';
import KeyboardPreview from '@/components/KeyboardPreview';
import VsChallenge from '@/components/VsChallenge';
import { useTypingGame } from '@/hooks/useTypingGame';
import { useLocalStats } from '@/hooks/useLocalStats';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHistory } from '@/hooks/useHistory';
import { getRandomText, getTextCount } from '@/data/texts';
import { RotateCcw, Shuffle, ClipboardPaste } from 'lucide-react';

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
    try { return localStorage.getItem('keysfingers_sound') !== 'false'; } catch { return true; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showVs, setShowVs] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(() => {
    try { return localStorage.getItem('keysfingers_keyboard') !== 'false'; } catch { return true; }
  });
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('keysfingers_dark') === 'true' || document.documentElement.classList.contains('dark'); } catch { return true; }
  });

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('keysfingers_dark', String(darkMode));
  }, [darkMode]);

  const { stats, userInput, handleInput, reset, targetText } = useTypingGame(currentText.text);
  const { personalBest, streak, saveResult } = useLocalStats();
  const { playKeystroke, playError, playComplete, playMilestone } = useSoundEffects(soundEnabled);
  const { history, addEntry, clearHistory, aggregatedMistyped } = useHistory();

  const prevInputLen = useRef(0);
  const isComplete = mode === 'standard' ? stats.isComplete : timedComplete;

  // Sound toggle persist
  const handleSoundToggle = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('keysfingers_sound', String(next));
      return next;
    });
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
  }, [userInput]);

  // Completion sound
  useEffect(() => {
    if (isComplete && stats.wpm > 0) {
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
    }
  }, [isComplete]);

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

  const handleRestart = () => {
    reset();
    loadNewText(difficulty);
    setIsNewBest(false);
    setTimeRemaining(null);
    setTimedComplete(false);
    prevInputLen.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Keyboard shortcut: Esc to reset or close views
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showHistory) {
          setShowHistory(false);
        } else if (showHeatmap) {
          setShowHeatmap(false);
        } else {
          handleRestart();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [difficulty, customText, showHistory, showHeatmap]);

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
        }}
        showHeatmap={showHeatmap}
        onHeatmapToggle={() => {
          setShowHeatmap(p => !p);
          setShowHistory(false);
          setShowVs(false);
        }}
        showKeyboard={showKeyboard}
        onKeyboardToggle={() => {
          setShowKeyboard(p => {
            const next = !p;
            localStorage.setItem('keysfingers_keyboard', String(next));
            return next;
          });
        }}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(p => !p)}
        showVs={showVs}
        onVsToggle={() => {
          setShowVs(p => !p);
          setShowHistory(false);
          setShowHeatmap(false);
        }}
      />

      <main className="flex-1 container mx-auto px-4 py-1 lg:py-2 max-w-7xl">
        {showVs ? (
          <VsChallenge onExit={() => setShowVs(false)} soundEnabled={soundEnabled} />
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
