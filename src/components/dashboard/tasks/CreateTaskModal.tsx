"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { CustomDropdown, type DropdownOption } from "@/components/ui/CustomDropdown";
import { AGENT_ROLES } from "@/constants/ai-core";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const createTask = useMutation(api.tasks.create);
    const agents = useQuery(api.agents.get, {}) ?? [];
    const canCreate = title.trim().length > 0;

    const agentOptions: DropdownOption[] = [
        {
            id: "",
            label: "Unassigned",
            icon: <Icon icon="lucide:user-x" className="text-sm text-neutral-500" />,
        },
        ...agents.map((a) => {
            const agentRole = AGENT_ROLES[a.name];
            const avatarSrc = agentRole?.avatar;
            return {
                id: a.name,
                label: a.name.charAt(0).toUpperCase() + a.name.slice(1),
                sublabel: agentRole?.role,
                icon: avatarSrc ? (
                    <div className="relative w-5 h-5 shrink-0">
                        <Image src={avatarSrc} alt={a.name} fill className="object-cover rounded-full" />
                    </div>
                ) : (
                    <Icon icon="lucide:bot" className="text-sm text-blue-400" />
                ),
            };
        }),
    ];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canCreate || submitting) return;
        setSubmitting(true);
        try {
            await createTask({
                title: title.trim(),
                description: description.trim(),
                assigneeNames: selectedAgentId ? [selectedAgentId] : [],
            });
            setTitle("");
            setDescription("");
            setSelectedAgentId("");
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create task");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="bg-[#09090b] border-white/10 p-0 sm:max-w-[32.5rem] overflow-hidden rounded-[24px] gap-0 text-white shadow-2xl shadow-black/60"
                showCloseButton={false}
            >
                {/* ── Header ── */}
                <DialogHeader className="px-6 py-4 border-b border-white/5 bg-white/1 shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-base font-semibold text-white tracking-tight">
                            New Task
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Create a new task by providing a title and optional description.
                        </DialogDescription>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="text-neutral-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 cursor-pointer !mt-0"
                    >
                        <Icon icon="lucide:x" className="text-lg" />
                    </button>
                </DialogHeader>

                {/* ── Body ── */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[65vh] no-scrollbar">
                        {/* Assign to */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-white tracking-tight">
                                Assign to
                                <span className="ml-1.5 text-xs font-normal text-neutral-500">
                                    optional
                                </span>
                            </label>
                            <CustomDropdown
                                options={agentOptions}
                                value={selectedAgentId}
                                onChange={setSelectedAgentId}
                                placeholder="Unassigned"
                                maxItems={5}
                            />
                        </div>

                        {/* Title */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="task-title"
                                className="text-sm font-semibold text-white tracking-tight"
                            >
                                Title
                            </label>
                            <input
                                id="task-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                autoFocus
                                className="w-full bg-white/2 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="task-description"
                                className="text-sm font-semibold text-white tracking-tight"
                            >
                                Description
                                <span className="ml-1.5 text-xs font-normal text-neutral-500">
                                    optional
                                </span>
                            </label>
                            <textarea
                                id="task-description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add any relevant details..."
                                className="w-full bg-white/2 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 py-4 border-t border-white/5 bg-white/1 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canCreate || submitting}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-black bg-white hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                        >
                            {submitting && (
                                <Icon icon="lucide:loader-2" className="text-sm animate-spin" />
                            )}
                            Create Task
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
