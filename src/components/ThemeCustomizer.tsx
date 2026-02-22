import { useState, useMemo, useEffect } from 'react';
import { X, RotateCcw, Save, Settings2, Palette, Type, Sparkles, Layout } from 'lucide-react';

interface CustomThemeSettings {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    error: string;
    caret: string;
    font: string;
    fontSize: number;
    letterSpacing: number;
    blur: number;
}

const DEFAULT_CUSTOM: CustomThemeSettings = {
    background: '#0a0a0a',
    foreground: '#e5e5e5',
    primary: '#3b82f6',
    secondary: '#1a1a1a',
    accent: '#2563eb',
    border: '#262626',
    error: '#ef4444',
    caret: '#3b82f6',
    font: 'JetBrains Mono',
    fontSize: 16,
    letterSpacing: 0,
    blur: 0,
};

const PRESETS: Record<string, CustomThemeSettings> = {
    'Cyberpunk 2077': {
        ...DEFAULT_CUSTOM,
        background: '#000000',
        foreground: '#fcee0a',
        primary: '#fcee0a',
        secondary: '#111111',
        accent: '#00f0ff',
        border: '#fcee0a',
        caret: '#fcee0a',
        font: 'JetBrains Mono',
    },
    'Dracula': {
        ...DEFAULT_CUSTOM,
        background: '#282a36',
        foreground: '#f8f8f2',
        primary: '#bd93f9',
        secondary: '#44475a',
        accent: '#ff79c6',
        border: '#6272a4',
        caret: '#ff79c6',
        font: 'JetBrains Mono',
    },
    'Monokai': {
        ...DEFAULT_CUSTOM,
        background: '#272822',
        foreground: '#f8f8f2',
        primary: '#a6e22e',
        secondary: '#3e3d32',
        accent: '#f92672',
        border: '#49483e',
        caret: '#f92672',
        font: 'Roboto Mono',
    },
    'Nordic': {
        ...DEFAULT_CUSTOM,
        background: '#2e3440',
        foreground: '#eceff4',
        primary: '#88c0d0',
        secondary: '#3b4252',
        accent: '#5e81ac',
        border: '#4c566a',
        caret: '#88c0d0',
        font: 'Inter',
    },
    'Sakura': {
        ...DEFAULT_CUSTOM,
        background: '#1a1012',
        foreground: '#fbcfe8',
        primary: '#f472b6',
        secondary: '#2d1b1e',
        accent: '#db2777',
        border: '#4a2b30',
        caret: '#f472b6',
        font: 'Space Grotesk',
    }
};

const FONTS = [
    'JetBrains Mono',
    'Space Grotesk',
    'Inter',
    'Roboto Mono',
    'Courier New',
    'monospace',
    'system-ui'
];

interface ThemeCustomizerProps {
    onClose: () => void;
    onSave: (settings: CustomThemeSettings) => void;
    initialSettings?: CustomThemeSettings;
}

type Tab = 'colors' | 'typography' | 'effects' | 'presets';

const ThemeCustomizer = ({ onClose, onSave, initialSettings }: ThemeCustomizerProps) => {
    const [settings, setSettings] = useState<CustomThemeSettings>(() => ({
        ...DEFAULT_CUSTOM,
        ...(initialSettings || {}),
    }));
    const [activeTab, setActiveTab] = useState<Tab>('colors');

    // Dynamically load fonts for preview
    useEffect(() => {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${FONTS.filter(f => !['monospace', 'system-ui', 'Courier New'].includes(f)).map(f => f.replace(' ', '+')).join('&family=')}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link); };
    }, []);

    const hexToHsl = (hex: string): string => {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '0 0% 0%';
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        } else {
            return '0 0% 0%';
        }
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const handleApply = () => onSave(settings);
    const resetToDefault = () => setSettings(DEFAULT_CUSTOM);

    const tabs = [
        { id: 'colors', label: 'Colors', icon: Palette },
        { id: 'typography', label: 'Typography', icon: Type },
        { id: 'effects', label: 'Effects', icon: Sparkles },
        { id: 'presets', label: 'Presets', icon: Layout },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-background animate-in fade-in duration-300">
            <div
                className="w-full h-full flex flex-col overflow-hidden"
                style={{ fontSize: '14px' }}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-mono font-bold uppercase tracking-wider">Advanced Theme Engine</h2>
                            <p className="text-[10px] text-muted-foreground font-mono">CRAFT YOUR PERSONAL TYPING REALITY</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Sidebar Tabs */}
                    <div className="w-64 border-r border-border bg-secondary/5 flex flex-col p-4 gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-mono transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-primary text-primary-foreground shadow-xl scale-[1.02]'
                                        : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <tab.icon className="h-5 w-5" />
                                <span className="font-bold tracking-tight">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-background">
                        <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar space-y-12">
                            {activeTab === 'colors' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <ColorInput label="Background" value={settings.background} onChange={v => setSettings(s => ({ ...s, background: v }))} />
                                    <ColorInput label="Text Color" value={settings.foreground} onChange={v => setSettings(s => ({ ...s, foreground: v }))} />
                                    <ColorInput label="Primary" value={settings.primary} onChange={v => setSettings(s => ({ ...s, primary: v }))} />
                                    <ColorInput label="Secondary" value={settings.secondary} onChange={v => setSettings(s => ({ ...s, secondary: v }))} />
                                    <ColorInput label="Accent" value={settings.accent} onChange={v => setSettings(s => ({ ...s, accent: v }))} />
                                    <ColorInput label="Borders" value={settings.border} onChange={v => setSettings(s => ({ ...s, border: v }))} />
                                    <ColorInput label="Error Text" value={settings.error} onChange={v => setSettings(s => ({ ...s, error: v }))} />
                                    <ColorInput label="Caret/Cursor" value={settings.caret} onChange={v => setSettings(s => ({ ...s, caret: v }))} />
                                </div>
                            )}

                            {activeTab === 'typography' && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Select Font Family</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {FONTS.map(font => (
                                                <button
                                                    key={font}
                                                    onClick={() => setSettings(s => ({ ...s, font }))}
                                                    className={`px-3 py-2.5 text-xs font-mono border rounded-lg transition-all text-left truncate ${settings.font === font ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/40 bg-secondary/20'
                                                        }`}
                                                    style={{ fontFamily: font }}
                                                >
                                                    {font}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <RangeInput
                                            label="Font Size"
                                            value={settings.fontSize}
                                            min={12} max={32} step={1} unit="px"
                                            onChange={v => setSettings(s => ({ ...s, fontSize: v }))}
                                        />
                                        <RangeInput
                                            label="Letter Spacing"
                                            value={settings.letterSpacing}
                                            min={-1} max={10} step={0.5} unit="px"
                                            onChange={v => setSettings(s => ({ ...s, letterSpacing: v }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'effects' && (
                                <div className="space-y-8">
                                    <RangeInput
                                        label="Glassmorphism Blur"
                                        value={settings.blur}
                                        min={0} max={40} step={1} unit="px"
                                        onChange={v => setSettings(s => ({ ...s, blur: v }))}
                                    />
                                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-4">
                                        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-mono leading-relaxed text-muted-foreground">
                                            The blur effect is visible in the preview area below. Higher blur values create a deeper "frosted glass" look.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'presets' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(PRESETS).map(([name, preset]) => (
                                        <button
                                            key={name}
                                            onClick={() => setSettings(preset)}
                                            className="group p-4 border border-border bg-secondary/20 rounded-xl hover:border-primary transition-all text-left space-y-3"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-mono font-bold group-hover:text-primary transition-colors">{name}</span>
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.background }}></div>
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.primary }}></div>
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.accent }}></div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {['Aa', '123', '?!'].map(t => (
                                                    <div key={t} className="text-[10px] px-2 py-0.5 rounded bg-background/50 font-mono" style={{ color: preset.foreground, fontFamily: preset.font }}>{t}</div>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bottom Preview */}
                        <div className="px-6 py-4 bg-secondary/10 border-t border-border mt-auto relative overflow-hidden">
                            {/* Background pattern to make blur visible */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                                backgroundImage: `radial-gradient(${settings.primary} 1px, transparent 1px)`,
                                backgroundSize: '20px 20px'
                            }}></div>

                            <div
                                className="relative p-6 rounded-xl border transition-all duration-200 shadow-2xl z-10"
                                style={{
                                    backgroundColor: `${settings.background}${settings.blur > 0 ? '99' : ''}`,
                                    color: settings.foreground,
                                    borderColor: settings.border,
                                    fontFamily: settings.font,
                                    fontSize: `${settings.fontSize}px`,
                                    letterSpacing: `${settings.letterSpacing}px`,
                                    backdropFilter: `blur(${settings.blur}px)`,
                                    WebkitBackdropFilter: `blur(${settings.blur}px)`
                                }}
                            >
                                <div className="flex items-center gap-3 mb-4 border-b pb-2" style={{ borderColor: `${settings.border}44` }}>
                                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: settings.primary }}></div>
                                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: settings.primary }}>Terminal Preview</span>
                                </div>
                                <p className="mb-4 leading-relaxed">
                                    The quick brown <span style={{ color: settings.primary }}>fox</span> jumps over the <span className="line-through decoration-2" style={{ textDecorationColor: settings.error, color: settings.error }}>lazy</span> dog.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-[1.2em] animate-pulse" style={{ backgroundColor: settings.caret }}></div>
                                    <div className="px-3 py-1 bg-secondary rounded text-[9px] font-mono font-bold" style={{ backgroundColor: settings.secondary, color: settings.primary }}>
                                        LATENCY: 12ms
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-secondary/50 flex items-center justify-between">
                    <button
                        onClick={resetToDefault}
                        className="flex items-center gap-2 px-4 py-2 text-[11px] font-mono uppercase font-bold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Factory Reset
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-[11px] font-mono uppercase font-bold bg-secondary hover:bg-secondary/80 rounded-lg transition-all"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex items-center gap-2 px-8 py-2 bg-primary text-primary-foreground text-[11px] font-mono font-bold uppercase rounded-lg shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Save className="h-4 w-4" />
                            Sync Theme
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div className="space-y-2.5">
        <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</label>
            <span className="text-[9px] font-mono text-muted-foreground uppercase">{value || '#000000'}</span>
        </div>
        <div className="flex items-center gap-3">
            <div
                className="w-10 h-10 rounded-xl border border-border shadow-inner cursor-pointer relative overflow-hidden group hover:border-primary transition-all"
                style={{ backgroundColor: value || '#000000' }}
            >
                <input
                    type="color"
                    value={value && value.startsWith('#') ? value : '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
            </div>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 bg-secondary/40 border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary transition-all"
            />
        </div>
    </div>
);

const RangeInput = ({ label, value, min, max, step, unit, onChange }: { label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (v: number) => void }) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</label>
            <span className="text-xs font-mono font-bold text-primary">{value}{unit}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-secondary-foreground/10 rounded-lg appearance-none cursor-pointer accent-primary"
        />
    </div>
);

export default ThemeCustomizer;
export type { CustomThemeSettings };
