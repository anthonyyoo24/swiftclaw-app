"use client";

import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

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

export function GoalsStep({ value, onChange }: GoalsStepProps) {
    const toggle = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/20 mx-auto mb-4">
                    <Target className="w-6 h-6 text-rose-300" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">What are your main goals?</h1>
                <p className="text-neutral-400">Select everything that applies — we&apos;ll recommend the right agent.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GOAL_OPTIONS.map((goal) => {
                    const isSelected = value.includes(goal.id);
                    return (
                        <button
                            key={goal.id}
                            onClick={() => toggle(goal.id)}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left",
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

            {value.length > 0 && (
                <p className="text-center text-xs text-neutral-500 animate-in fade-in duration-300">
                    {value.length} goal{value.length !== 1 ? "s" : ""} selected
                </p>
            )}
        </div>
    );
}
