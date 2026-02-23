import { Info, Github, Globe, Heart, Rocket, Shield, Zap, Sparkles, Code, Cpu, Swords, MessageSquare } from 'lucide-react';

const AboutPanel = ({ onExit }: { onExit: () => void }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Info className="h-6 w-6 text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-bold font-mono glitch-text" data-text="About Keys&Fingers">
                        About Project
                    </h2>
                </div>
                <button
                    onClick={onExit}
                    className="px-4 py-2 text-xs font-mono rounded-sm bg-secondary text-secondary-foreground hover:bg-accent border border-border transition-all"
                >
                    Back to Game (Esc)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="md:col-span-2 space-y-8">
                    <section className="space-y-4">
                        <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Rocket className="h-5 w-5" /> The Mission
                        </h3>
                        <p className="text-muted-foreground font-mono leading-relaxed">
                            Keys&Fingers is more than just a typing test. It's a glitch-themed, high-performance environment designed for typing enthusiasts who crave both aesthetics and functionality. Our goal is to provide a platform where you can measure your speed, improve your accuracy, and challenge others in real-time.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Cpu className="h-5 w-5" /> The Technology
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-border bg-secondary/20">
                                <div className="flex items-center gap-2 mb-2 text-foreground font-bold font-mono text-sm">
                                    <Zap className="h-4 w-4 text-amber-500" /> Frontend
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                    Built with React 18, Vite for lightning-fast bundling, and Tailwind CSS for a modern, responsive UI.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-secondary/20">
                                <div className="flex items-center gap-2 mb-2 text-foreground font-bold font-mono text-sm">
                                    <Shield className="h-4 w-4 text-green-500" /> Backend
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                    Powered by Supabase for real-time multiplayer racing, public lobby chat, and secure data persistence.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-secondary/20">
                                <div className="flex items-center gap-2 mb-2 text-foreground font-bold font-mono text-sm">
                                    <Sparkles className="h-4 w-4 text-purple-500" /> Aesthetics
                                    Available in multiple glitch presets and a fully custom theme engine inspired by Cyberpunk environments.
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                    Crafted with Lucide icons, Framer Motion (via shadcn), and custom CSS shaders.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-secondary/20">
                                <div className="flex items-center gap-2 mb-2 text-foreground font-bold font-mono text-sm">
                                    <Code className="h-4 w-4 text-blue-500" /> Desktop
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                    Wrapped in Electron for a native desktop experience with system-level optimizations.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Swords className="h-5 w-5" /> Gaming Ecosystem
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 rounded-xl border border-border bg-secondary/20">
                                <div className="flex items-center gap-2 mb-2 text-foreground font-bold font-mono text-sm underline decoration-amber-500/50 underline-offset-4">
                                    VS Challenge Mode
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                                    Enter the arena for high-stakes 1v1 typing battles. Create a private room, share your unique battle code, and race against an opponent in real-time. Features include custom difficulty settings, live progress tracking, and unique rewards for the winner.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-secondary/20">
                                <div className="flex items-center gap-2 mb-2 text-foreground font-bold font-mono text-sm underline decoration-green-500/50 underline-offset-4">
                                    Global Chat (GC) Lobby
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                                    The heart of the community. Join the public lobby to meet other typists, discuss strategies, or send direct challenges. Our GC Lobby persists 7 days of message history and features a real-time presence system showing who's currently idle, racing, or busy.
                                </p>
                            </div>
                        </div>
                    </section>

                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-20 h-20 rounded-[3px] overflow-hidden border-2 border-primary shadow-xl bg-secondary/30 shrink-0">
                                <img src="https://raw.githubusercontent.com/iamovi/iamovi/refs/heads/main/assets/init_ovi.jpg" alt="Ovi" className="w-full h-full object-cover px-1" />
                            </div>
                            <div>
                                <h4 className="font-mono font-bold text-foreground">Ovi</h4>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Lead Developer</p>
                            </div>
                        </div>
                        <p className="text-xs font-mono text-muted-foreground italic leading-relaxed">
                            "Built for the typists who want to feel the glitch in every keystroke."
                        </p>
                        <div className="pt-4 flex flex-col gap-2">
                            <a href="https://github.com/iamovi" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-[11px] font-mono transition-colors">
                                <Github className="h-3.5 w-3.5" /> github.com/iamovi
                            </a>
                            <a href="https://iamovi.github.io/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-[11px] font-mono transition-colors">
                                <Globe className="h-3.5 w-3.5" /> iamovi.github.io
                            </a>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-border bg-card shadow-lg text-center space-y-4">
                        <Heart className="h-8 w-8 text-red-500 mx-auto animate-pulse" />
                        <div>
                            <h4 className="font-mono font-bold text-sm">Open Source</h4>
                            <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">MIT LICENSE</p>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                            This project is free to use and modify. Built with ❤️ for the community.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AboutPanel;
