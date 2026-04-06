"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import { useWizardField } from "../hooks/useWizardField";
import { useFormContext } from "react-hook-form";
import type { OnboardingFormValues } from "../schema";

interface WorkflowOption {
    id: string;
    label: string;
    emoji: string;
}

const BUSINESS_WORKFLOW_OPTIONS: WorkflowOption[] = [
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
];

const PERSONAL_WORKFLOW_OPTIONS: WorkflowOption[] = [
    { id: "summarise-articles", label: "Summarize articles & newsletters", emoji: "📰" },
    { id: "draft-emails", label: "Draft emails & messages", emoji: "✉️" },
    { id: "set-reminders", label: "Set reminders & daily check-ins", emoji: "🔔" },
    { id: "plan-meals", label: "Plan meals & grocery lists", emoji: "🥗" },
    { id: "research-topics", label: "Research topics & compile notes", emoji: "🔍" },
    { id: "manage-reading", label: "Manage my reading list", emoji: "📚" },
    { id: "track-habits", label: "Track habits & goals", emoji: "🎯" },
    { id: "plan-trips", label: "Plan trips & itineraries", emoji: "✈️" },
    { id: "write-journal", label: "Write journal entries", emoji: "📓" },
    { id: "find-news", label: "Find & summarize news", emoji: "🗞️" },
    { id: "brainstorm", label: "Brainstorm ideas", emoji: "💡" },
];

const CUSTOM_PREFIX = "__CUSTOM__:";

export function WorkflowsStep() {
    const { watch } = useFormContext<OnboardingFormValues>();
    const usageType = watch("usageType");
    const WORKFLOW_OPTIONS = usageType === "personal" ? PERSONAL_WORKFLOW_OPTIONS : BUSINESS_WORKFLOW_OPTIONS;

    const { value: rawValue, onChange } = useWizardField("workflows");
    const value: string[] = rawValue || [];

    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [tempWorkflowValue, setTempWorkflowValue] = useState("");
    const [editingEntry, setEditingEntry] = useState<string | null>(null);

    const customWorkflows = value.filter((v: string) => v.startsWith(CUSTOM_PREFIX));

    const trimmed = tempWorkflowValue.trim();
    const newEntry = CUSTOM_PREFIX + trimmed;
    const isDuplicate = trimmed.length > 0 && (
        editingEntry !== null
            ? newEntry !== editingEntry && value.includes(newEntry)
            : value.includes(newEntry)
    );

    const togglePreset = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v: string) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    const addCustomWorkflow = () => {
        const text = tempWorkflowValue.trim();
        if (!text) return;
        if (editingEntry !== null) {
            onChange(value.map((v: string) => v === editingEntry ? CUSTOM_PREFIX + text : v));
            setEditingEntry(null);
        } else {
            onChange([...value, CUSTOM_PREFIX + text]);
        }
        setTempWorkflowValue("");
        setIsAddingCustom(false);
    };

    const startEditingWorkflow = (entry: string) => {
        setEditingEntry(entry);
        setTempWorkflowValue(entry.slice(CUSTOM_PREFIX.length));
        setIsAddingCustom(true);
    };

    const cancelCustomWorkflow = () => {
        setTempWorkflowValue("");
        setIsAddingCustom(false);
        setEditingEntry(null);
    };

    const removeCustomWorkflow = (entry: string) => {
        onChange(value.filter((v: string) => v !== entry));
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
                    const isSelected = value.includes(wf.id);
                    return (
                        <button
                            key={wf.id}
                            type="button"
                            onClick={() => togglePreset(wf.id)}
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

                {customWorkflows.map((entry, index) => {
                    const raw = entry.slice(CUSTOM_PREFIX.length);
                    const displayLabel = raw.length > 40 ? raw.slice(0, 40) + "…" : raw;
                    const isBeingEdited = editingEntry === entry;
                    return (
                        <div
                            key={index}
                            className={cn(
                                "relative group flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-md",
                                isBeingEdited
                                    ? "bg-white/5 border-white/30 text-neutral-400"
                                    : "bg-white/10 border-white text-white"
                            )}
                        >
                            <span className="text-xl shrink-0">⚡</span>
                            <span className="text-sm font-medium leading-tight flex-1 min-w-0 truncate">{displayLabel}</span>
                            <button
                                type="button"
                                onClick={() => startEditingWorkflow(entry)}
                                aria-label="Edit workflow"
                                className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 hover:text-blue-400 hover:border-blue-500/30 transition-all z-10 cursor-pointer"
                                title="Edit workflow"
                            >
                                <Pencil className="w-3 h-3 translate-x-px" />
                            </button>
                            <button
                                type="button"
                                onClick={() => removeCustomWorkflow(entry)}
                                aria-label="Remove workflow"
                                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 hover:text-red-400 hover:border-red-500/30 transition-all z-10 cursor-pointer"
                                title="Remove workflow"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}

                {!isAddingCustom && (
                    <button
                        type="button"
                        onClick={() => setIsAddingCustom(true)}
                        className={cn(
                            "group flex items-center justify-center gap-2 px-4 py-3.5 min-h-16 rounded-xl border border-dashed cursor-pointer",
                            "transition-all duration-150 hover:-translate-y-0.5",
                            "bg-white/5 border-white/20 text-neutral-400 hover:border-white/40 hover:text-neutral-200 hover:bg-white/10"
                        )}
                    >
                        <Plus className="w-4 h-4 shrink-0 translate-y-0.5px" />
                        <span className="text-sm font-medium leading-none">Add Custom</span>
                    </button>
                )}
            </div>

            {isAddingCustom && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                        <Textarea
                            aria-label="Custom workflow description"
                            value={tempWorkflowValue}
                            onChange={(e) => setTempWorkflowValue(e.target.value)}
                            aria-invalid={isDuplicate}
                            placeholder="Describe the workflow you want to automate..."
                            variant="glass"
                            className="min-h-20 no-drag select-text relative z-50 resize-none pb-10"
                            rows={4}
                            autoFocus
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2 z-50">
                            <button
                                type="button"
                                onClick={cancelCustomWorkflow}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={addCustomWorkflow}
                                disabled={!trimmed || isDuplicate || (editingEntry !== null && trimmed === editingEntry.slice(CUSTOM_PREFIX.length))}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                                    (trimmed && !isDuplicate && (editingEntry === null || trimmed !== editingEntry.slice(CUSTOM_PREFIX.length)))
                                        ? "bg-white text-black hover:bg-white/90 cursor-pointer"
                                        : "bg-white/10 text-neutral-500 cursor-not-allowed"
                                )}
                            >
                                {editingEntry !== null ? "Save Changes" : "Add Workflow"}
                            </button>
                        </div>
                    </div>
                    {isDuplicate && (
                        <p className="text-xs text-red-400 mt-2">This workflow already exists.</p>
                    )}
                </div>
            )}
        </div>
    );
}
