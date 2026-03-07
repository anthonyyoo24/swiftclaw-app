import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const VIBE_PRESETS = [
    "Dry & Witty",
    "Warm & Encouraging",
    "Direct & Pragmatic",
    "Chaotic Creative",
    "Ultra Professional",
    "Sarcastic Sysadmin",
];

interface AgentVibeViewProps {
    vibe: string;
    onChange: (vibe: string) => void;
}

export function AgentVibeView({ vibe, onChange }: AgentVibeViewProps) {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">How would you describe its vibe in one line?</h1>
                <p className="text-lg text-neutral-400">Think of it as their tone of voice. How does it come across in conversation?</p>
            </div>

            <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {VIBE_PRESETS.map((preset) => (
                        <button
                            key={preset}
                            onClick={() => onChange(preset)}
                            className={cn(
                                "px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border",
                                vibe === preset
                                    ? "bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                    : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:border-white/20"
                            )}
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                <div className="relative pt-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 bg-[#0a0a0c] text-sm text-neutral-500 uppercase tracking-widest font-medium">Or type your own</span>
                    </div>
                </div>

                <Input
                    value={vibe}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Custom vibe..."
                    className="h-14 text-lg px-6 bg-white/5 border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:ring-purple-500/20 text-center rounded-xl"
                />
            </div>
        </div>
    );
}
