"use client";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/Textarea";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import { useWizardField } from "../hooks/useWizardField";

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

const CUSTOM_PREFIX = "__CUSTOM__:";

export function WorkflowsStep() {
    const { value: rawValue, onChange } = useWizardField("workflows");
    const value = rawValue || [];
    const customEntryIndex = value.findIndex(v => v.startsWith(CUSTOM_PREFIX));
    const isCustomActive = customEntryIndex !== -1;
    const customText = isCustomActive ? value[customEntryIndex].slice(CUSTOM_PREFIX.length) : "";

    const togglePreset = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v: string) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    const toggleOther = () => {
        if (isCustomActive) {
            onChange(value.filter((_: string, i: number) => i !== customEntryIndex));
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
                title="What will your agent handle?"
                description="Pick the workflows you want to automate first."
                icon="solar:bolt-linear"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WORKFLOW_OPTIONS.map((wf) => {
                    const isOther = wf.id === "other";
                    const isSelected = isOther ? isCustomActive : value.includes(wf.id);
                    return (
                        <button
                            key={wf.id}
                            type="button"
                            onClick={() => isOther ? toggleOther() : togglePreset(wf.id)}
                            aria-pressed={isSelected}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left cursor-pointer",
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

            {isCustomActive && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Textarea
                        aria-label="Custom workflow description"
                        value={customText}
                        onChange={(e) => handleCustomChange(e.target.value)}
                        placeholder="Describe the workflow you want to automate..."
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
