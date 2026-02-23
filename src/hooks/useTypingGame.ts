import { useState, useCallback, useEffect, useRef } from 'react';

export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  elapsedTime: number;
  isComplete: boolean;
  isStarted: boolean;
  progress: number;
  mistypedChars: Record<string, number>;
}

export interface UseTypingGameReturn {
  stats: TypingStats;
  currentIndex: number;
  userInput: string;
  handleInput: (value: string) => void;
  reset: () => void;
  targetText: string;
}

export const useTypingGame = (text: string): UseTypingGameReturn => {
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [mistypedChars, setMistypedChars] = useState<Record<string, number>>({});
  const [totalMistakes, setTotalMistakes] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isStarted = userInput.length > 0;

  // Count current state early to compute accuracy before declaring isComplete
  let correctChars = 0;
  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] === text[i]) correctChars++;
  }
  const totalAttempts = userInput.length + totalMistakes;
  const accuracy = totalAttempts > 0
    ? Math.max(0, Math.round(((totalAttempts - totalMistakes) / totalAttempts) * 100))
    : 100;

  // Require 70%+ accuracy to count as complete — blocks spammers who mash through the text
  const MIN_ACCURACY_TO_FINISH = 70;
  const isComplete = userInput.length === text.length && userInput.length > 0 && accuracy >= MIN_ACCURACY_TO_FINISH;


  const progress = Math.round((userInput.length / text.length) * 100);

  // WPM: (correct strokes / 5) / minutes
  const minutes = elapsedTime / 60;
  const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;

  // Timer
  useEffect(() => {
    if (isStarted && !isComplete && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStarted, isComplete, startTime]);

  const handleInput = useCallback((value: string) => {
    if (value.length > text.length) return;

    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }

    // Track mistyped chars
    if (value.length > userInput.length) {
      const newCharIndex = value.length - 1;
      const typed = value[newCharIndex];
      const expected = text[newCharIndex];
      if (typed !== expected) {
        setTotalMistakes(prev => prev + 1);
        setMistypedChars(prev => ({
          ...prev,
          [expected]: (prev[expected] || 0) + 1,
        }));
      }
    }

    setUserInput(value);
  }, [text, startTime, userInput.length]);

  const reset = useCallback(() => {
    setUserInput('');
    setStartTime(null);
    setElapsedTime(0);
    setMistypedChars({});
    setTotalMistakes(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return {
    stats: {
      wpm,
      accuracy,
      correctChars,
      incorrectChars: totalMistakes,
      totalChars: text.length,
      elapsedTime,
      isComplete,
      isStarted,
      progress,
      mistypedChars,
    },
    currentIndex: userInput.length,
    userInput,
    handleInput,
    reset,
    targetText: text,
  };
};
