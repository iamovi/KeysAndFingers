import { TypingStats } from '@/hooks/useTypingGame';
import { RotateCcw } from 'lucide-react';

interface ResultsPanelProps {
  stats: TypingStats;
  onRestart: () => void;
  isNewBest: boolean;
}

const ResultsPanel = ({ stats, onRestart, isNewBest }: ResultsPanelProps) => {
  const topMistyped = Object.entries(stats.mistypedChars)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <div className="border border-border rounded-md bg-card p-4 lg:p-5 space-y-4 lg:space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-mono glitch-text" data-text="Session Complete">
          Session Complete
        </h2>
        {isNewBest && (
          <p className="text-sm text-success font-mono animate-pulse">
            ★ New Personal Best! ★
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ResultStat label="WPM" value={stats.wpm} />
        <ResultStat label="Accuracy" value={`${stats.accuracy}%`} />
        <ResultStat label="Correct" value={stats.correctChars} />
        <ResultStat label="Errors" value={stats.incorrectChars} />
      </div>

      {/* Mistyped characters */}
      {topMistyped.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Most Mistyped Characters
          </h3>
          <div className="flex flex-wrap gap-2">
            {topMistyped.map(([char, count]) => (
              <span
                key={char}
                className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded-sm font-mono text-sm"
              >
                <span className="font-bold">{char === ' ' ? '␣' : char}</span>
                <span className="text-xs opacity-70">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background font-mono text-sm rounded-sm hover:opacity-90 transition-opacity glitch-hover"
      >
        <RotateCcw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
};

const ResultStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center p-3 bg-secondary rounded-sm">
    <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
    <p className="text-2xl font-bold font-mono mt-1">{value}</p>
  </div>
);

export default ResultsPanel;
