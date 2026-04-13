"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { AGENT_ROLES } from "@/constants/ai-core";

type TagColor = "red" | "blue" | "purple" | "orange" | "emerald" | "neutral";

const colorStyles: Record<TagColor, { tag: string; iconBg: string }> = {
    red: { tag: "bg-red-500/10 text-red-400 border-red-500/20", iconBg: "bg-red-500/20 border-red-500/30 text-red-400" },
    blue: { tag: "bg-blue-500/10 text-blue-400 border-blue-500/20", iconBg: "bg-blue-500/20 border-blue-500/30 text-blue-400" },
    purple: { tag: "bg-purple-500/10 text-purple-400 border-purple-500/20", iconBg: "bg-purple-500/20 border-purple-500/30 text-purple-400" },
    orange: { tag: "bg-orange-500/10 text-orange-400 border-orange-500/20", iconBg: "bg-orange-500/20 border-orange-500/30 text-orange-400" },
    emerald: { tag: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", iconBg: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" },
    neutral: { tag: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20", iconBg: "bg-white/10 border-white/20 border-dashed text-neutral-400" },
};

const STATUS_TAG: Record<Doc<"tasks">["status"], { label: string; color: TagColor }> = {
    inbox: { label: "Inbox", color: "neutral" },
    assigned: { label: "Assigned", color: "blue" },
    in_progress: { label: "In Progress", color: "orange" },
    review: { label: "Review", color: "purple" },
    done: { label: "Done", color: "emerald" },
};

interface TaskCardProps {
    task: Doc<"tasks">;
    agentMap?: Record<string, Doc<"agents">>;
    onClick: () => void;
    isSelected?: boolean;
}

export function TaskCard({ task, agentMap = {}, onClick, isSelected = false }: TaskCardProps) {
    const removeTask = useMutation(api.tasks.remove);
    const { label, color } = STATUS_TAG[task.status];
    const styles = colorStyles[color];
    const isDone = task.status === "done";

    const date = new Date(task.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    function handleCancel(e: React.MouseEvent) {
        e.stopPropagation();
        removeTask({ id: task._id });
    }

    const assignees = (task.assigneeIds || [])
        .map((id) => agentMap[id])
        .filter(Boolean) as Doc<"agents">[];
    const visibleAssignees = assignees.slice(0, 2);

    return (
        <div
            onClick={onClick}
            className={`p-3 bg-white/5 border rounded-xl hover:bg-white/10 transition-colors cursor-pointer shadow-sm flex flex-col min-h-30 ${isSelected ? "border-blue-500/40 bg-blue-500/5" : "border-white/10"
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${styles.tag}`}>
                    {label}
                </span>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="text-neutral-600 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                    title="Remove task"
                >
                    <Icon icon="lucide:x" className="text-[16px]" />
                </button>
            </div>
            <p className={`text-[13px] font-medium mb-3 ${isDone ? "text-neutral-400 line-through" : "text-white"}`}>
                {task.title}
            </p>
            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-neutral-500">
                    <Icon icon="lucide:calendar" className="text-[10px]" />
                    <span className="text-[11px] font-medium">{date}</span>
                </div>
                {visibleAssignees.length === 0 ? (
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${colorStyles.neutral.iconBg}`}>
                        <Icon icon="lucide:bot" className="text-[10px]" />
                    </div>
                ) : (
                    <div className="flex items-center">
                        {visibleAssignees.map((agent, i) => {
                            const normalizedName = agent.name?.toLowerCase() || "";
                            const avatarSrc = agent.avatar ?? AGENT_ROLES[normalizedName]?.avatar;
                            const initial = agent.name ? agent.name.charAt(0).toUpperCase() : "🤖";
                            
                            return (
                                <div
                                    key={agent._id}
                                    className="relative w-6 h-6 rounded-full border border-[#09090b] bg-white/10 text-white overflow-hidden flex items-center justify-center shrink-0"
                                    style={{ marginLeft: i > 0 ? "-6px" : undefined }}
                                >
                                    {avatarSrc ? (
                                        <Image src={avatarSrc} alt={agent.name || "Agent"} fill className="object-cover" />
                                    ) : (
                                        <span className="text-[10px] font-medium">{initial}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
