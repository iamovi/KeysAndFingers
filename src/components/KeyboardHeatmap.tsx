interface KeyboardHeatmapProps {
  mistypedChars: Record<string, number>;
}

const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' '],
];

const getHeatColor = (intensity: number): string => {
  if (intensity === 0) return 'bg-secondary text-secondary-foreground';
  if (intensity < 0.25) return 'bg-warning/20 text-warning';
  if (intensity < 0.5) return 'bg-warning/40 text-warning';
  if (intensity < 0.75) return 'bg-destructive/40 text-destructive';
  return 'bg-destructive/70 text-destructive-foreground';
};

const KeyboardHeatmap = ({ mistypedChars }: KeyboardHeatmapProps) => {
  const maxCount = Math.max(1, ...Object.values(mistypedChars));

  const allKeys = ROWS.flat();
  const hasData = allKeys.some(k => (mistypedChars[k] || 0) > 0 || (mistypedChars[k.toUpperCase()] || 0) > 0);

  if (!hasData) {
    return (
      <div className="border border-border rounded-md bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          Complete a few sessions to see your typing heatmap
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md bg-card p-4 space-y-3">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
        Mistype Heatmap
      </h3>
      <div className="flex flex-col items-center gap-1">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map(key => {
              const count = (mistypedChars[key] || 0) + (mistypedChars[key.toUpperCase()] || 0);
              const intensity = count / maxCount;
              const isSpace = key === ' ';
              return (
                <div
                  key={key}
                  className={`
                    ${getHeatColor(intensity)}
                    ${isSpace ? 'w-40 sm:w-64' : 'w-7 sm:w-9'}
                    h-7 sm:h-9 flex items-center justify-center rounded-sm
                    text-[10px] sm:text-xs font-mono transition-colors duration-300
                    relative group
                  `}
                  title={`${key === ' ' ? 'Space' : key}: ${count} mistakes`}
                >
                  {isSpace ? '␣' : key}
                  {count > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {count}×
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-mono">
        <span>Low</span>
        <div className="flex gap-0.5">
          {['bg-secondary', 'bg-warning/20', 'bg-warning/40', 'bg-destructive/40', 'bg-destructive/70'].map(c => (
            <div key={c} className={`w-4 h-2 rounded-sm ${c}`} />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  );
};

export default KeyboardHeatmap;
