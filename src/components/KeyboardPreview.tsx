import { useState, useEffect } from 'react';

const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
];

const DISPLAY: Record<string, string> = {
  '`': '~\n`', '1': '!\n1', '2': '@\n2', '3': '#\n3', '4': '$\n4',
  '5': '%\n5', '6': '^\n6', '7': '&\n7', '8': '*\n8', '9': '(\n9',
  '0': ')\n0', '-': '_\n-', '=': '+\n=', '[': '{\n[', ']': '}\n]',
  '\\': '|\n\\', ';': ':\n;', "'": '"\n\'', ',': '<\n,', '.': '>\n.', '/': '?\n/',
};

// Map characters to their base key
const charToKey = (char: string): string => {
  const shiftMap: Record<string, string> = {
    '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6',
    '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
    '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
  };
  if (shiftMap[char]) return shiftMap[char];
  return char.toLowerCase();
};

const needsShift = (char: string): boolean => {
  if (char >= 'A' && char <= 'Z') return true;
  return '~!@#$%^&*()_+{}|:"<>?'.includes(char);
};

interface KeyboardPreviewProps {
  activeChar: string | null;
}

const KeyboardPreview = ({ activeChar }: KeyboardPreviewProps) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [shiftActive, setShiftActive] = useState(false);

  useEffect(() => {
    if (activeChar) {
      setPressedKey(charToKey(activeChar));
      setShiftActive(needsShift(activeChar));
    } else {
      setPressedKey(null);
      setShiftActive(false);
    }
    const timeout = setTimeout(() => {
      setPressedKey(null);
      setShiftActive(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [activeChar]);

  return (
    <div className="hidden lg:block select-none">
      <div className="rounded-md border border-border bg-card p-4 space-y-1.5 shadow-inner">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1.5" style={{ paddingLeft: ri === 1 ? 16 : ri === 2 ? 28 : ri === 3 ? 44 : 0 }}>
            {row.map(key => {
              const isActive = pressedKey === key;
              const display = DISPLAY[key] || key.toUpperCase();
              return (
                <div
                  key={key}
                  className={`
                    flex items-center justify-center rounded-sm font-mono text-[10px] leading-tight whitespace-pre-wrap text-center transition-all duration-100
                    w-10 h-10 border border-transparent
                    ${isActive
                      ? 'bg-foreground text-background scale-95 shadow-lg border-foreground/20'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }
                  `}
                >
                  {display}
                </div>
              );
            })}
          </div>
        ))}
        {/* Space bar row */}
        <div className="flex justify-center gap-1.5" style={{ paddingLeft: 44 }}>
          <div
            className={`flex items-center justify-center rounded-sm font-mono text-[10px] transition-all duration-100 h-10 border border-transparent
              ${shiftActive ? 'bg-foreground text-background scale-95' : 'bg-secondary text-secondary-foreground'}
            `}
            style={{ width: 72 }}
          >
            SHIFT
          </div>
          <div
            className={`flex items-center justify-center rounded-sm font-mono text-[10px] transition-all duration-100 h-10 border border-transparent
              ${pressedKey === ' ' ? 'bg-foreground text-background scale-95 shadow-lg border-foreground/20' : 'bg-secondary text-secondary-foreground'}
            `}
            style={{ width: 240 }}
          >
            SPACE
          </div>
          <div
            className={`flex items-center justify-center rounded-sm font-mono text-[10px] transition-all duration-100 h-10 border border-transparent
              ${shiftActive ? 'bg-foreground text-background scale-95' : 'bg-secondary text-secondary-foreground'}
            `}
            style={{ width: 72 }}
          >
            SHIFT
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardPreview;
