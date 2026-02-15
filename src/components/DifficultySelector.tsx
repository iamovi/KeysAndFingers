interface DifficultySelectorProps {
  difficulty: 'easy' | 'medium' | 'hard' | 'custom';
  onSelect: (d: 'easy' | 'medium' | 'hard' | 'custom') => void;
  mode: 'standard' | 'timed';
  onModeChange: (m: 'standard' | 'timed') => void;
  timerDuration: number;
  onTimerChange: (t: number) => void;
  disabled?: boolean;
}

const DifficultySelector = ({
  difficulty,
  onSelect,
  mode,
  onModeChange,
  timerDuration,
  onTimerChange,
  disabled,
}: DifficultySelectorProps) => {
  const difficulties: Array<{ value: 'easy' | 'medium' | 'hard' | 'custom'; label: string }> = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'custom', label: 'Custom' },
  ];

  const timers = [15, 30, 60];

  return (
    <div className="flex flex-col gap-3 lg:gap-4 w-full">
      {/* Difficulty */}
      <div className="space-y-2">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] font-bold">Level</span>
        <div className="flex flex-wrap lg:grid lg:grid-cols-2 gap-2">
          {difficulties.map(d => (
            <button
              key={d.value}
              onClick={() => onSelect(d.value)}
              disabled={disabled}
              className={`flex-1 min-w-[70px] px-2 py-1.5 text-[11px] font-mono rounded-sm border transition-all duration-200 
                ${difficulty === d.value
                  ? 'bg-foreground text-background border-foreground shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="space-y-1">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] font-bold">Mode</span>
        <div className="flex lg:grid lg:grid-cols-2 gap-2">
          {(['standard', 'timed'] as const).map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              disabled={disabled}
              className={`flex-1 px-3 py-1.5 text-[11px] font-mono rounded-sm border transition-all duration-200
                ${mode === m
                  ? 'bg-foreground text-background border-foreground shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {m === 'standard' ? 'Zen' : 'Timed'}
            </button>
          ))}
        </div>
      </div>

      {/* Timer duration */}
      {mode === 'timed' && (
        <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] font-bold">Time</span>
          <div className="flex lg:grid lg:grid-cols-3 gap-2">
            {timers.map(t => (
              <button
                key={t}
                onClick={() => onTimerChange(t)}
                disabled={disabled}
                className={`flex-1 px-2 py-1.5 text-[11px] font-mono rounded-sm border transition-all duration-200
                  ${timerDuration === t
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
                  }
                  disabled:opacity-40 disabled:cursor-not-allowed
                `}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DifficultySelector;
