import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = [
    {
        name: "Symbols",
        emojis: ["🦞", "⭐️", "🔥", "✨", "💡", "⚡️", "☄️", "🚀", "🪐", "💎"],
    },
    {
        name: "Tech & Work",
        emojis: ["💻", "⌨️", "🖥️", "🛠️", "⚙️", "📈", "📋", "📁", "🔍", "📡"],
    },
    {
        name: "Faces",
        emojis: ["🤖", "👾", "👽", "👻", "🤓", "😎", "🤔", "🤫", "🫠", "🤯"],
    },
    {
        name: "Animals",
        emojis: ["🦊", "🦉", "🐙", "🦖", "🦄", "🦅", "🐝", "🐕", "🐈", "🦇"],
    },
];

interface AgentEmojiViewProps {
    emoji: string;
    onChange: (emoji: string) => void;
}

export function AgentEmojiView({ emoji, onChange }: AgentEmojiViewProps) {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">What is its signature emoji?</h1>
                <p className="text-lg text-neutral-400">The agent uses this for reactions and identity. The default is 🦞.</p>
            </div>

            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-[280px] overflow-y-auto no-scrollbar shadow-inner">
                    <div className="space-y-8">
                        {EMOJI_CATEGORIES.map((category) => (
                            <div key={category.name} className="space-y-3">
                                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">{category.name}</h3>
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                                    {category.emojis.map((e) => (
                                        <button
                                            key={e}
                                            onClick={() => onChange(e)}
                                            className={cn(
                                                "aspect-square text-3xl sm:text-2xl flex items-center justify-center rounded-xl transition-all duration-200",
                                                emoji === e
                                                    ? "bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-110 z-10"
                                                    : "hover:bg-white/10 hover:scale-110"
                                            )}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 bg-[#0a0a0c] text-sm text-neutral-500 uppercase tracking-widest font-medium">Or paste your own</span>
                    </div>
                </div>

                <div className="flex justify-center flex-col items-center space-y-2">
                    <Input
                        value={emoji}
                        onChange={(e) => {
                            // Try to extract only the first character/emoji if they paste a string
                            const val = e.target.value;
                            if (val.length > 0) {
                                // Match the first unicode character
                                const match = val.match(/\p{Extended_Pictographic}|\p{Emoji}/u);
                                if (match) {
                                    onChange(match[0]);
                                    return;
                                }
                            }
                            onChange(val);
                        }}
                        placeholder="Paste emoji..."
                        className="w-24 h-24 text-5xl text-center bg-white/5 border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-2xl shadow-inner"
                    />
                </div>
            </div>
        </div>
    );
}
