import { AgentTemplateId } from "../schema";
import { cn } from "@/lib/utils";

interface Template {
    id: AgentTemplateId;
    title: string;
    description: string;
    emoji: string;
    color: string;
}

const TEMPLATES: Template[] = [
    {
        id: "scholar",
        title: "The Scholar",
        description: "A meticulous, highly organized assistant that prioritizes accuracy and detailed research.",
        emoji: "📚",
        color: "from-blue-500/20 to-indigo-500/20",
    },
    {
        id: "rebel",
        title: "The Rebel",
        description: "A sharp, independent thinker that cuts through corporate speak and tells it like it is.",
        emoji: "⚡️",
        color: "from-rose-500/20 to-orange-500/20",
    },
    {
        id: "copilot",
        title: "The Co-Pilot",
        description: "A pragmatic, efficient companion focused entirely on shipping code and getting things done.",
        emoji: "🚀",
        color: "from-emerald-500/20 to-teal-500/20",
    },
    {
        id: "ghost",
        title: "The Ghost",
        description: "A silent, invisible observer that only speaks when absolutely necessary.",
        emoji: "👻",
        color: "from-purple-500/20 to-fuchsia-500/20",
    },
];

interface CharacterSelectionViewProps {
    selectedTemplateId: AgentTemplateId | undefined;
    onSelect: (id: AgentTemplateId) => void;
}

export function CharacterSelectionView({ selectedTemplateId, onSelect }: CharacterSelectionViewProps) {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Choose a Persona</h1>
                <p className="text-neutral-400">Select a pre-configured template, or forge your own identity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEMPLATES.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template.id)}
                            className={cn(
                                "relative group text-left px-6 py-5 rounded-2xl border transition-all duration-200",
                                "hover:-translate-y-1 hover:shadow-lg",
                                isSelected
                                    ? "bg-white/5 border-white shadow-md shadow-white/5"
                                    : "bg-white/5 border-white/10 hover:border-white/30"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-300 pointer-events-none",
                                template.color,
                                isSelected ? "opacity-100" : "group-hover:opacity-100"
                            )}></div>

                            <div className="relative flex items-start gap-4">
                                <div className={cn(
                                    "flex items-center justify-center w-12 h-12 rounded-xl text-2xl transition-transform duration-300",
                                    isSelected ? "bg-white/20 scale-110" : "bg-white/10 group-hover:bg-white/20 group-hover:scale-110"
                                )}>
                                    {template.emoji}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-white tracking-tight">{template.title}</h3>
                                        {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                                        {template.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}

                <button
                    onClick={() => onSelect("custom")}
                    className={cn(
                        "relative group text-left px-6 py-5 rounded-2xl border border-dashed transition-all duration-200",
                        "hover:-translate-y-1 hover:shadow-lg h-full flex flex-col justify-center",
                        selectedTemplateId === "custom"
                            ? "bg-white/5 border-white border-solid shadow-md shadow-white/5"
                            : "bg-transparent border-white/20 hover:border-white/40"
                    )}
                >
                    <div className="relative flex items-center gap-4">
                        <div className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-xl text-xl transition-all duration-300",
                            selectedTemplateId === "custom" ? "bg-white text-black scale-110 border border-transparent" : "bg-transparent text-white border border-white/20 group-hover:border-white/40 group-hover:bg-white/10"
                        )}>
                            +
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-white tracking-tight">Custom Identity</h3>
                            <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                                Manually configure the name, nature, vibe, and emoji.
                            </p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
