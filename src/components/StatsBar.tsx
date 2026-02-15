import { TypingStats } from '@/hooks/useTypingGame';
import { PersonalBest, StreakData } from '@/hooks/useLocalStats';
import { Zap, Target, Clock, Flame, Trophy } from 'lucide-react';

interface StatsBarProps {
  stats: TypingStats;
  personalBest: PersonalBest | null;
  streak: StreakData;
  timeRemaining?: number | null;
}

const StatsBar = ({ stats, personalBest, streak, timeRemaining }: StatsBarProps) => {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 lg:space-y-3 w-full">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold font-mono">Progress</span>
          <span className="text-[9px] font-mono font-bold">{Math.round(stats.progress)}%</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-300 ease-out"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem icon={<Zap className="h-4 w-4" />} label="WPM" value={stats.wpm} highlight />
        <StatItem icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${stats.accuracy}%`} />
        <StatItem
          icon={<Clock className="h-4 w-4" />}
          label={timeRemaining != null ? 'Remaining' : 'Time'}
          value={formatTime(timeRemaining != null ? timeRemaining : stats.elapsedTime)}
        />
        <StatItem icon={<Flame className="h-4 w-4" />} label="Streak" value={streak.current} />
        {personalBest && (
          <div className="col-span-2">
            <StatItem icon={<Trophy className="h-4 w-4" />} label="Best WPM" value={personalBest.wpm} />
          </div>
        )}
      </div>
    </div>
  );
};

const StatItem = ({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) => (
  <div className="flex flex-col gap-0.5 p-2 lg:p-3 rounded-md border border-border bg-card/50 shadow-sm transition-colors hover:border-foreground/20">
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground scale-50 lg:scale-75">{icon}</span>
      <span className="text-[8px] lg:text-[9px] uppercase tracking-[0.1em] lg:tracking-[0.15em] text-muted-foreground font-bold font-mono truncate">{label}</span>
    </div>
    <div className={`text-base lg:text-xl font-bold font-mono tabular-nums ${highlight ? 'glitch-text' : ''}`} data-text={String(value)}>
      {value}
    </div>
  </div>
);

export default StatsBar;
