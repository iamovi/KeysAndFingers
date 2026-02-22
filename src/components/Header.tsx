import { useState } from 'react';
import { Zap, Sparkles, Waves, Palette, Keyboard, Volume2, VolumeX, History, Grid3X3, Menu, X, Monitor, Sun, Moon, Swords, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  soundEnabled: boolean;
  onSoundToggle: () => void;
  showHistory: boolean;
  onHistoryToggle: () => void;
  showHeatmap: boolean;
  onHeatmapToggle: () => void;
  showKeyboard: boolean;
  onKeyboardToggle: () => void;
  theme: 'light' | 'dark' | 'matrix' | 'cyberpink' | 'retro' | 'midnight' | 'nord' | 'aurora' | 'animate';
  onThemeChange: (theme: 'light' | 'dark' | 'matrix' | 'cyberpink' | 'retro' | 'midnight' | 'nord' | 'aurora' | 'animate') => void;
  showVs?: boolean;
  onVsToggle?: () => void;
}

const THEMES: { id: 'light' | 'dark' | 'matrix' | 'cyberpink' | 'retro' | 'midnight' | 'nord' | 'aurora' | 'animate', name: string, icon: React.ReactNode, color: string, isAnimated?: boolean }[] = [
  { id: 'light', name: 'Light', icon: <Sun className="h-4 w-4" />, color: 'text-foreground' },
  { id: 'dark', name: 'Dark', icon: <Moon className="h-4 w-4" />, color: 'text-foreground' },
  { id: 'matrix', name: 'Matrix', icon: <Palette className="h-4 w-4" />, color: 'text-[#00ff41]' },
  { id: 'cyberpink', name: 'Cyberpink', icon: <Palette className="h-4 w-4" />, color: 'text-[#ff00ff]' },
  { id: 'retro', name: 'Retro', icon: <Palette className="h-4 w-4" />, color: 'text-[#ffb000]' },
  { id: 'midnight', name: 'Midnight', icon: <Moon className="h-4 w-4" />, color: 'text-[#3b82f6]' },
  { id: 'nord', name: 'Nord', icon: <Palette className="h-4 w-4" />, color: 'text-[#88c0d0]' },
  { id: 'aurora', name: 'Aurora', icon: <Sparkles className="h-4 w-4 animate-pulse" />, color: 'text-[#00ff9f]', isAnimated: true },
  { id: 'animate', name: 'Animate', icon: <Zap className="h-4 w-4 animate-bounce" style={{ animationDuration: '2s' }} />, color: 'text-primary', isAnimated: true },
];

const Header = ({
  soundEnabled,
  onSoundToggle,
  showHistory,
  onHistoryToggle,
  showHeatmap,
  onHeatmapToggle,
  showKeyboard,
  onKeyboardToggle,
  theme,
  onThemeChange,
  showVs,
  onVsToggle,
}: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getThemeIcon = () => {
    const current = THEMES.find(t => t.id === theme);
    const Icon = current?.icon || <Palette className="h-3.5 w-3.5" />;
    return <span className={current?.color}>{Icon}</span>;
  };

  const toggleButtons = (
    <>
      {onVsToggle && (
        <button
          onClick={onVsToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-sm transition-all duration-200
            ${showVs ? 'bg-amber-500 text-white' : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-amber-500'}`}
          title="VS Challenge"
        >
          <Swords className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">VS</span>
        </button>
      )}
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-sm bg-secondary text-secondary-foreground hover:bg-accent transition-all duration-200"
            title="Choose theme"
          >
            {getThemeIcon()}
            <span className="hidden sm:inline uppercase">{theme}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-border min-w-[150px]">
          <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Select Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEMES.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className="flex items-center justify-between gap-2 cursor-pointer font-mono text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={t.color}>{t.icon}</span>
                {t.name}
              </div>
              {theme === t.id && <Check className="h-3 w-3 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <header className="border-b border-border py-2 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="alien.png" alt="Keys&Fingers Logo" className="h-8 w-8 object-contain" />
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
