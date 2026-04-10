"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Icon } from "@iconify/react";

interface TaskDetailPanelProps {
    taskId: Id<"tasks">;
    onClose: () => void;
}

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
    const task = useQuery(api.tasks.getById, { id: taskId });
    const messages = useQuery(api.taskMessages.listByTask, { taskId });
    const updateStatus = useMutation(api.tasks.updateStatus);

    if (task === undefined) {
        return (
            <div className="w-72 shrink-0 border-l border-white/5 flex flex-col h-full bg-white/[0.02] animate-pulse">
                <div className="p-4 border-b border-white/5 h-14 bg-white/5" />
                <div className="p-4 space-y-3">
                    <div className="h-4 rounded bg-white/5 w-3/4" />
                    <div className="h-3 rounded bg-white/5 w-full" />
                    <div className="h-3 rounded bg-white/5 w-2/3" />
                </div>
            </div>
        );
    }

    if (task === null) {
        return null;
    }

    const isDone = task.status === "done";
    const date = new Date(task.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    function handleCancel() {
        updateStatus({ id: taskId, status: "done" });
        onClose();
    }

    return (
        <div className="w-72 shrink-0 border-l border-white/5 flex flex-col h-full bg-white/[0.02]">
            {/* Header */}
            <div className="px-4 h-14 border-b border-white/5 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-white tracking-tight">Task Detail</span>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-neutral-500 hover:text-white transition-colors p-1 rounded"
                >
                    <Icon icon="lucide:x" className="text-sm" />
                </button>
            </div>

            {/* Task info */}
            <div className="p-4 border-b border-white/5 shrink-0 space-y-2">
                <p className={`text-sm font-medium leading-snug ${isDone ? "text-neutral-400 line-through" : "text-white"}`}>
                    {task.title}
                </p>
                {task.description && (
                    <p className="text-xs text-neutral-500 leading-relaxed">{task.description}</p>
                )}
                <div className="flex items-center gap-1.5 text-neutral-600 pt-1">
                    <Icon icon="lucide:calendar" className="text-[10px]" />
                    <span className="text-[11px]">{date}</span>
                </div>
                {!isDone && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors border border-red-500/20"
                    >
                        <Icon icon="lucide:x-circle" className="text-sm" />
                        Cancel Task
                    </button>
                )}
            </div>

            {/* Agent thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Agent Thread</p>

                {messages === undefined && (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                        ))}
                    </div>
                )}

                {messages?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Icon icon="lucide:message-square" className="text-2xl text-neutral-700 mb-2" />
                        <p className="text-xs text-neutral-600">No messages yet.</p>
                        <p className="text-[11px] text-neutral-700 mt-0.5">Agents will post updates here.</p>
                    </div>
                )}

                {messages?.map((msg) => (
                    <div key={msg._id} className="p-2.5 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30">
                                <Icon icon="lucide:bot" className="text-[8px] text-blue-400" />
                            </div>
                            <span className="text-[10px] text-neutral-500">
                                {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">{msg.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
