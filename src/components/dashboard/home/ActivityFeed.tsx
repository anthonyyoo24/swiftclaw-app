"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { Icon } from "@iconify/react";
import { timeAgo } from "@/lib/utils";

type FeedItemType = "started" | "blocked" | "completed" | "message";

type ActivityType = Doc<"activities">["type"];

const TYPE_MAP: Record<ActivityType, FeedItemType> = {
    task_created: "started",
    task_assigned: "started",
    task_status_changed: "started",
    message_sent: "message",
    document_created: "completed",
    document_updated: "completed",
};

const EVENT_LABELS: Record<ActivityType, string> = {
    task_created: "Task Created",
    task_assigned: "Task Assigned",
    task_status_changed: "Status Changed",
    message_sent: "Message Sent",
    document_created: "Document Created",
    document_updated: "Document Updated",
};

const typeStyles: Record<FeedItemType, { bg: string; border: string; text: string; icon: string }> = {
    started: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: "lucide:play" },
    blocked: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: "lucide:triangle-alert" },
    completed: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: "lucide:file-text" },
    message: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", icon: "lucide:message-square" },
};

type EnrichedActivity = Doc<"activities"> & { agentName: string };

function FeedItemCard({ item, isLast }: { item: EnrichedActivity; isLast: boolean }) {
    const feedType = TYPE_MAP[item.type];
    const styles = typeStyles[feedType];
    return (
        <div className="flex gap-4 group">
            <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full ${styles.bg} ${styles.border} border flex items-center justify-center ${styles.text} z-10`}>
                    <Icon icon={styles.icon} className="text-sm" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-white/10 mt-2 min-h-4" />}
            </div>
            <div className="flex-1 pb-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{item.agentName}</span>
                            <span className="text-[10px] text-neutral-300 font-medium px-2 py-0.5 rounded-md bg-white/10 border border-white/5">
                                {EVENT_LABELS[item.type]}
                            </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-medium">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-neutral-300 leading-relaxed">{item.message}</p>
                </div>
            </div>
        </div>
    );
}

export function ActivityFeed() {
    const activities = useQuery(api.activities.list, {});

    return (
        <main className="flex-1 flex flex-col bg-transparent relative min-w-0">
            <div className="h-14 border-b border-white/5 flex items-center px-6 shrink-0 bg-white/1 backdrop-blur-sm z-10">
                <h3 className="text-sm font-semibold text-white tracking-tight">Activity Feed</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <div className="max-w-3xl">
                    {activities === undefined ? (
                        <div className="flex items-center justify-center h-20 text-neutral-500 text-sm">Loading...</div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 text-neutral-500">
                            <Icon icon="lucide:activity" className="text-3xl" />
                            <p className="text-sm">No activity yet</p>
                        </div>
                    ) : (
                        (activities as EnrichedActivity[]).map((item, index) => (
                            <FeedItemCard
                                key={item._id}
                                item={item}
                                isLast={index === activities.length - 1}
                            />
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
