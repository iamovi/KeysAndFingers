import { useRef, useEffect, useState } from 'react';

interface TypingAreaProps {
  targetText: string;
  userInput: string;
  onInput: (value: string) => void;
  disabled?: boolean;
}

const TypingArea = ({ targetText, userInput, onInput, disabled }: TypingAreaProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [targetText]);

  const handleClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="relative cursor-text rounded-md border border-border bg-card p-4 lg:p-4 transition-colors focus-within:border-foreground/30"
      onClick={handleClick}
    >
      {/* Rendered text display */}
      <div className="font-mono text-lg leading-relaxed select-none" aria-hidden>
        {targetText.split('').map((char, i) => {
          let className = 'text-muted-foreground/40'; // untyped
          if (i < userInput.length) {
            if (userInput[i] === char) {
              className = 'text-success'; // correct
            } else {
              className = 'text-destructive bg-destructive/10 rounded-sm'; // incorrect
            }
          }
          if (i === userInput.length && isFocused) {
            className += ' border-l-2 border-foreground animate-cursor-blink'; // cursor
          }
          return (
            <span key={i} className={`${className} transition-colors duration-75`}>
              {char}
            </span>
          );
        })}
      </div>

      {/* Hidden input */}
      <textarea
        ref={inputRef}
        value={userInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={e => onInput(e.target.value)}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-text resize-none"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  );
};

export default TypingArea;
