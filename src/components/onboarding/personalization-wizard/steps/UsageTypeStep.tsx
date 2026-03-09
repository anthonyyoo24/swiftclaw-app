"use client";

import { cn } from "@/lib/utils";
import { Building2, User } from "lucide-react";
import type { UsageType } from "../schema";

interface UsageTypeStepProps {
    value: UsageType | undefined;
    onChange: (value: UsageType) => void;
}

interface UsageOption {
    id: UsageType;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    border: string;
}

const OPTIONS: UsageOption[] = [
    {
        id: "business",
        title: "For My Business",
        subtitle: "Automate customer ops, sales, admin tasks, and workflows for your team or customers.",
        icon: Building2,
        gradient: "from-indigo-500/20 to-blue-500/20",
        border: "border-indigo-400",
    },
    {
        id: "personal",
        title: "For Personal Use",
        subtitle: "A smart assistant for your day-to-day tasks, research, writing, and productivity.",
        icon: User,
        gradient: "from-purple-500/20 to-fuchsia-500/20",
        border: "border-purple-400",
    },
];

export function UsageTypeStep({ value, onChange }: UsageTypeStepProps) {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">How will you use Swiftclaw?</h1>
                <p className="text-neutral-400">This helps us tailor your experience and recommend the right agent.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {OPTIONS.map((option) => {
                    const isSelected = value === option.id;
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.id}
                            onClick={() => onChange(option.id)}
                            className={cn(
                                "relative group text-left p-8 rounded-2xl border-2 transition-all duration-200",
                                "hover:-translate-y-1 hover:shadow-xl flex flex-col gap-5",
                                isSelected
                                    ? `bg-white/5 ${option.border} shadow-lg`
                                    : "bg-white/5 border-white/10 hover:border-white/30"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 rounded-2xl bg-linear-to-br opacity-0 transition-opacity duration-300 pointer-events-none",
                                option.gradient,
                                isSelected ? "opacity-100" : "group-hover:opacity-50"
                            )} />
                            <div className="relative">
                                <div className={cn(
                                    "w-14 h-14 rounded-xl flex items-center justify-center mb-1 transition-all duration-300",
                                    isSelected ? "bg-white/20 scale-110" : "bg-white/10 group-hover:bg-white/15 group-hover:scale-105"
                                )}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <div className="relative space-y-1.5">
                                <h3 className="text-lg font-semibold text-white tracking-tight">{option.title}</h3>
                                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed">
                                    {option.subtitle}
                                </p>
                            </div>
                            {isSelected && (
                                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-white animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
