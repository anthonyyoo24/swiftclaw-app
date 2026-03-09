import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const BOUNDARY_PRESETS = [
    "Never share private info",
    "Always ask before acting externally",
    "Never reply to group chats as the user",
    "Do not hallucinate facts",
    "Keep answers under 3 sentences by default",
];

interface BoundariesViewProps {
    boundaries: string[];
    onChange: (boundaries: string[]) => void;
}

export function BoundariesView({ boundaries, onChange }: BoundariesViewProps) {
    const handleAdd = () => {
        onChange([...boundaries, ""]);
    };

    const handleUpdate = (index: number, value: string) => {
        const newBoundaries = [...boundaries];
        newBoundaries[index] = value;
        onChange(newBoundaries);
    };

    const handleRemove = (index: number) => {
        const newBoundaries = boundaries.filter((_, i) => i !== index);
        if (newBoundaries.length === 0) {
            onChange([""]);
        } else {
            onChange(newBoundaries);
        }
    };

    // Toggle a preset chip
    const togglePreset = (preset: string) => {
        // If it's already in the list, remove it
        if (boundaries.includes(preset)) {
            const next = boundaries.filter((b) => b !== preset);
            onChange(next.length === 0 ? [""] : next);
        } else {
            // Add it to the list. If list is just `[""]`, replace the empty string.
            if (boundaries.length === 1 && boundaries[0] === "") {
                onChange([preset]);
            } else {
                onChange([...boundaries, preset]);
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">What should this agent never do?</h1>
                <p className="text-lg text-neutral-400">Establish the hard boundaries and protocols for your agent&apos;s behavior.</p>
            </div>

            {/* Quick-add Safety Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {BOUNDARY_PRESETS.map((preset) => {
                    const isSelected = boundaries.includes(preset);
                    return (
                        <button
                            key={preset}
                            onClick={() => togglePreset(preset)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                                isSelected
                                    ? "bg-red-500/20 border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                                    : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20"
                            )}
                        >
                            {isSelected ? "× " : "+ "}{preset}
                        </button>
                    );
                })}
            </div>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-white/10"></div>
                </div>
            </div>

            <div className="space-y-4">
                {boundaries.map((boundary, i) => (
                    <div key={i} className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-sm">
                            {i + 1}
                        </div>
                        <Input
                            autoFocus={i === boundaries.length - 1 && boundary === ""}
                            value={boundary}
                            onChange={(e) => handleUpdate(i, e.target.value)}
                            placeholder="A hard boundary..."
                            className="h-12 flex-1 bg-white/5 border-white/10 hover:border-white/20 focus:border-red-500/50 shadow-inner rounded-xl"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(i)}
                            className="text-neutral-500 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
                            disabled={boundaries.length === 1 && boundary === ""}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-2">
                <Button
                    variant="outline"
                    onClick={handleAdd}
                    className="border-dashed border-white/20 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 text-neutral-400 rounded-xl px-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add another boundary
                </Button>
            </div>
        </div>
    );
}
