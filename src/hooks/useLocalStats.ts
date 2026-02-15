import { useState, useCallback } from 'react';

export interface PersonalBest {
  wpm: number;
  accuracy: number;
  difficulty: string;
  date: string;
}

export interface StreakData {
  current: number;
  best: number;
  lastDate: string;
}

const STATS_KEY = 'keysfingers_stats';
const STREAK_KEY = 'keysfingers_streak';

export const useLocalStats = () => {
  const [personalBest, setPersonalBest] = useState<PersonalBest | null>(() => {
    try {
      const stored = localStorage.getItem(STATS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [streak, setStreak] = useState<StreakData>(() => {
    try {
      const stored = localStorage.getItem(STREAK_KEY);
      return stored ? JSON.parse(stored) : { current: 0, best: 0, lastDate: '' };
    } catch { return { current: 0, best: 0, lastDate: '' }; }
  });

  const saveResult = useCallback((wpm: number, accuracy: number, difficulty: string) => {
    // Personal best
    if (!personalBest || wpm > personalBest.wpm) {
      const newBest: PersonalBest = { wpm, accuracy, difficulty, date: new Date().toISOString() };
      setPersonalBest(newBest);
      localStorage.setItem(STATS_KEY, JSON.stringify(newBest));
    }

    // Streak (accuracy >= 90% counts as success)
    if (accuracy >= 90) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let newStreak: StreakData;

      if (streak.lastDate === today) {
        newStreak = streak; // Already counted today
      } else if (streak.lastDate === yesterday || streak.current === 0) {
        const newCurrent = streak.current + 1;
        newStreak = {
          current: newCurrent,
          best: Math.max(newCurrent, streak.best),
          lastDate: today,
        };
      } else {
        newStreak = { current: 1, best: Math.max(1, streak.best), lastDate: today };
      }

      setStreak(newStreak);
      localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
    }
  }, [personalBest, streak]);

  return { personalBest, streak, saveResult };
};
