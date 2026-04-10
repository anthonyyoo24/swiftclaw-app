"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

export function TasksHeader() {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const createTask = useMutation(api.tasks.create);
    const canCreate = title.trim().length > 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canCreate || submitting) return;
        setSubmitting(true);
        try {
            await createTask({
                title: title.trim(),
                description: description.trim(),
                status: "inbox",
                assigneeIds: [],
            });
            setTitle("");
            setDescription("");
            setOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create task");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-white/1 backdrop-blur-sm z-10">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                    Tasks
                </h3>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/5"
                >
                    <Icon icon="lucide:plus" className="text-sm" />
                    New Task
                </button>
            </header>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white text-sm font-semibold">New Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-3 mt-1">
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                                Title
                            </label>
                            <Input
                                variant="glass"
                                placeholder="What needs to be done?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                                Description
                            </label>
                            <Input
                                variant="glass"
                                placeholder="Optional details..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!canCreate || submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <Icon icon="lucide:loader-2" className="text-sm animate-spin" />
                                ) : (
                                    <Icon icon="lucide:plus" className="text-sm" />
                                )}
                                Create Task
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
