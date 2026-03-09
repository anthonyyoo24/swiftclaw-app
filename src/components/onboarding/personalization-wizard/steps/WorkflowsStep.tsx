"use client";

import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface WorkflowsStepProps {
    value: string[];
    onChange: (value: string[]) => void;
}

interface WorkflowOption {
    id: string;
    label: string;
    emoji: string;
}

const WORKFLOW_OPTIONS: WorkflowOption[] = [
    { id: "answer-faq", label: "Answer FAQs automatically", emoji: "💬" },
    { id: "qualify-leads", label: "Qualify & follow up with leads", emoji: "🎯" },
    { id: "book-meetings", label: "Book meetings & send reminders", emoji: "📅" },
    { id: "send-follow-ups", label: "Send follow-up emails", emoji: "📧" },
    { id: "process-orders", label: "Process orders & refunds", emoji: "📦" },
    { id: "write-drafts", label: "Draft content & copy", emoji: "📝" },
    { id: "summarise-data", label: "Summarize reports & documents", emoji: "📄" },
    { id: "onboard-users", label: "Onboard new users or customers", emoji: "🚪" },
    { id: "track-tasks", label: "Track tasks & project status", emoji: "✅" },
    { id: "triage-tickets", label: "Triage & route support tickets", emoji: "🎟️" },
    { id: "social-media", label: "Schedule & manage social posts", emoji: "📲" },
    { id: "other", label: "Something custom", emoji: "⚡" },
];

export function WorkflowsStep({ value, onChange }: WorkflowsStepProps) {
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
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 mx-auto mb-4">
                    <Zap className="w-6 h-6 text-amber-300" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">What will your agent handle?</h1>
                <p className="text-neutral-400">Pick the workflows you want to automate first.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WORKFLOW_OPTIONS.map((wf) => {
                    const isSelected = value.includes(wf.id);
                    return (
                        <button
                            key={wf.id}
                            onClick={() => toggle(wf.id)}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left",
                                "transition-all duration-150 hover:-translate-y-0.5",
                                isSelected
                                    ? "bg-white/10 border-white text-white shadow-md"
                                    : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/30 hover:text-neutral-200"
                            )}
                        >
                            <span className="text-xl shrink-0">{wf.emoji}</span>
                            <span className="text-sm font-medium leading-tight">{wf.label}</span>
                        </button>
                    );
                })}
            </div>

            {value.length > 0 && (
                <p className="text-center text-xs text-neutral-500 animate-in fade-in duration-300">
                    {value.length} workflow{value.length !== 1 ? "s" : ""} selected
                </p>
            )}
        </div>
    );
}
