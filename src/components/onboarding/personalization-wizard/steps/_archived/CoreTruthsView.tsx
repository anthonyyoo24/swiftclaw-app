import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus } from "lucide-react";

interface CoreTruthsViewProps {
    truths: string[];
    onChange: (truths: string[]) => void;
}

export function CoreTruthsView({ truths, onChange }: CoreTruthsViewProps) {
    const handleAdd = () => {
        onChange([...truths, ""]);
    };

    const handleUpdate = (index: number, value: string) => {
        const newTruths = [...truths];
        newTruths[index] = value;
        onChange(newTruths);
    };

    const handleRemove = (index: number) => {
        const newTruths = truths.filter((_, i) => i !== index);
        // Always keep at least one empty input if they delete everything
        if (newTruths.length === 0) {
            onChange([""]);
        } else {
            onChange(newTruths);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">What are the things this agent holds as absolute truth?</h1>
                <p className="text-lg text-neutral-400">These are the first-principles that shape how it thinks. e.g., &apos;Honesty is paramount&apos;, &apos;Privacy is sacred&apos;.</p>
            </div>

            <div className="space-y-4">
                {truths.map((truth, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                            {i + 1}
                        </div>
                        <Input
                            autoFocus={i === truths.length - 1 && truth === ""}
                            value={truth}
                            onChange={(e) => handleUpdate(i, e.target.value)}
                            placeholder="A core truth..."
                            className="h-12 flex-1 bg-white/5 border-white/10 hover:border-white/20 focus:border-blue-500/50 shadow-inner rounded-xl"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(i)}
                            className="text-neutral-500 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
                            disabled={truths.length === 1 && truth === ""}
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
                    className="border-dashed border-white/20 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300 text-neutral-400 rounded-xl px-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add another truth
                </Button>
            </div>
        </div>
    );
}
