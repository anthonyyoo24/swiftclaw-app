"use client";

import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import { Textarea } from "@/components/ui/Textarea";

interface GoalsStepProps {
    value: string[];
    onChange: (value: string[]) => void;
}

interface GoalOption {
    id: string;
    label: string;
    emoji: string;
}

const GOAL_OPTIONS: GoalOption[] = [
    { id: "automate-support", label: "Automate customer support", emoji: "🎧" },
    { id: "boost-sales", label: "Boost sales & lead gen", emoji: "📈" },
    { id: "manage-schedule", label: "Manage my schedule", emoji: "📅" },
    { id: "handle-admin", label: "Handle admin & data entry", emoji: "📋" },
    { id: "create-content", label: "Create content & copy", emoji: "✍️" },
    { id: "research-insights", label: "Research & gather insights", emoji: "🔍" },
    { id: "manage-team", label: "Coordinate team & projects", emoji: "🤝" },
    { id: "analyse-data", label: "Analyse data & reports", emoji: "📊" },
    { id: "build-product", label: "Build & ship product faster", emoji: "🚀" },
    { id: "other", label: "Something else", emoji: "💡" },
];

const CUSTOM_PREFIX = "__CUSTOM__:";

export function GoalsStep({ value, onChange }: GoalsStepProps) {
    const customEntryIndex = value.findIndex(v => v.startsWith(CUSTOM_PREFIX));
    const isCustomActive = customEntryIndex !== -1;
    const customText = isCustomActive ? value[customEntryIndex].slice(CUSTOM_PREFIX.length) : "";

    const togglePreset = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    const toggleOther = () => {
        if (isCustomActive) {
            onChange(value.filter((_, i) => i !== customEntryIndex));
        } else {
            onChange([...value, CUSTOM_PREFIX]);
        }
    };

    const handleCustomChange = (text: string) => {
        if (isCustomActive) {
            const next = [...value];
            next[customEntryIndex] = CUSTOM_PREFIX + text;
            onChange(next);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                title="What are your main goals?"
                description="Select everything that applies — we'll recommend the right agent."
                icon="solar:target-linear"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GOAL_OPTIONS.map((goal) => {
                    const isOther = goal.id === "other";
                    const isSelected = isOther ? isCustomActive : value.includes(goal.id);
                    return (
                        <button
                            key={goal.id}
                            type="button"
                            onClick={() => isOther ? toggleOther() : togglePreset(goal.id)}
                            className={cn(
                                "group flex items-center cursor-pointer gap-3 px-4 py-3.5 rounded-xl border text-left",
                                "transition-all duration-150 hover:-translate-y-0.5",
                                isSelected
                                    ? "bg-white/10 border-white text-white shadow-md"
                                    : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/30 hover:text-neutral-200"
                            )}
                        >
                            <span className="text-xl shrink-0">{goal.emoji}</span>
                            <span className="text-sm font-medium leading-tight">{goal.label}</span>
                        </button>
                    );
                })}
            </div>

            {isCustomActive && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Textarea
                        value={customText}
                        onChange={(e) => handleCustomChange(e.target.value)}
                        placeholder="Tell us more about your goals..."
                        variant="glass"
                        className="min-h-20 no-drag select-text relative z-50 resize-none"
                        rows={6}
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
}
