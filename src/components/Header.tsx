import { useState, useEffect } from 'react';
import { Keyboard, Volume2, VolumeX, History, Grid3X3, Menu, X, Monitor, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  soundEnabled: boolean;
  onSoundToggle: () => void;
  showHistory: boolean;
  onHistoryToggle: () => void;
  showHeatmap: boolean;
  onHeatmapToggle: () => void;
  showKeyboard: boolean;
  onKeyboardToggle: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

const Header = ({
  soundEnabled,
  onSoundToggle,
  showHistory,
  onHistoryToggle,
  showHeatmap,
  onHeatmapToggle,
  showKeyboard,
  onKeyboardToggle,
  darkMode,
  onDarkModeToggle,
}: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleButtons = (
    <>
      <button
        onClick={onSoundToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-sm transition-all duration-200
          ${soundEnabled ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}
        title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
      >
        {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Sound</span>
      </button>
      <button
        onClick={onHistoryToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-sm transition-all duration-200
          ${showHistory ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}
        title="Toggle history"
      >
        <History className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">History</span>
      </button>
      <button
        onClick={onHeatmapToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-sm transition-all duration-200
          ${showHeatmap ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}
        title="Toggle heatmap"
      >
        <Grid3X3 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Heatmap</span>
      </button>
      <button
        onClick={onKeyboardToggle}
        className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-sm transition-all duration-200
          ${showKeyboard ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}
        title="Toggle keyboard preview"
      >
        <Monitor className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Keyboard</span>
      </button>
      <button
        onClick={onDarkModeToggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-sm bg-secondary text-secondary-foreground hover:bg-accent transition-all duration-200"
        title={darkMode ? 'Light mode' : 'Dark mode'}
      >
        {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
      </button>
    </>
  );

  return (
    <header className="border-b border-border py-2 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/alien.png" alt="Keys&Fingers Logo" className="h-8 w-8 object-contain" />
          <h1
            className="text-xl font-bold tracking-tight font-mono glitch-text"
            data-text="Keys&Fingers"
          >
            Keys&Fingers
          </h1>
        </div>

        {/* Desktop toggles */}
        <div className="hidden md:flex items-center gap-2">
          {toggleButtons}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground hover:bg-secondary rounded-sm transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-border">
          <div className="container mx-auto flex flex-wrap gap-2">
            {toggleButtons}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
