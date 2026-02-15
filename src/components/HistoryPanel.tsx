import { HistoryEntry } from '@/hooks/useHistory';
import { Clock, Zap, Target, Trash2 } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onClear: () => void;
}

const HistoryPanel = ({ history, onClear }: HistoryPanelProps) => {
  if (history.length === 0) {
    return (
      <div className="border border-border rounded-md bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          No history yet. Complete a session to see your results here.
        </p>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="border border-border rounded-md bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
          History ({history.length})
        </h3>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors font-mono"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {history.map(entry => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 bg-secondary/50 rounded-sm text-xs font-mono"
          >
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-28 truncate">{formatDate(entry.date)}</span>
              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] uppercase
                ${entry.difficulty === 'easy' ? 'bg-success/10 text-success' :
                  entry.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'}`}
              >
                {entry.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-muted-foreground" />
                {entry.wpm}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                {entry.accuracy}%
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {Math.round(entry.elapsedTime)}s
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;
