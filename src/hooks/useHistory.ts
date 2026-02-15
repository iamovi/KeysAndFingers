import { useState, useCallback } from 'react';

export interface HistoryEntry {
  id: string;
  wpm: number;
  accuracy: number;
  difficulty: string;
  mode: string;
  correctChars: number;
  incorrectChars: number;
  elapsedTime: number;
  mistypedChars: Record<string, number>;
  date: string;
}

const HISTORY_KEY = 'keysfingers_history';
const MAX_HISTORY = 50;

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'date'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
    };
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  // Aggregate all mistyped chars across history
  const aggregatedMistyped = history.reduce<Record<string, number>>((acc, entry) => {
    Object.entries(entry.mistypedChars).forEach(([char, count]) => {
      acc[char] = (acc[char] || 0) + count;
    });
    return acc;
  }, {});

  return { history, addEntry, clearHistory, aggregatedMistyped };
};
