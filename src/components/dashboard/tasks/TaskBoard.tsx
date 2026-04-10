"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { TaskDetailPanel } from "./TaskDetailPanel";

const COLUMN_CONFIG: { status: "inbox" | "assigned" | "in_progress" | "review" | "done"; title: string; isDimmed?: boolean }[] = [
    { status: "inbox", title: "Inbox" },
    { status: "assigned", title: "Assigned" },
    { status: "in_progress", title: "In Progress" },
    { status: "review", title: "Review" },
    { status: "done", title: "Done", isDimmed: true },
];

export function TaskBoard() {
    const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);
    const tasks = useQuery(api.tasks.list, {});

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-[10.7px]">
                <div className="flex gap-[10.7px] h-full min-w-max md:w-full pb-2">
                    {COLUMN_CONFIG.map((col) => {
                        const colTasks = (tasks ?? []).filter((t) => t.status === col.status);
                        return (
                            <TaskColumn
                                key={col.status}
                                title={col.title}
                                count={colTasks.length}
                                isDimmed={col.isDimmed}
                            >
                                {colTasks.map((task) => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        isSelected={selectedTaskId === task._id}
                                        onClick={() => setSelectedTaskId(task._id)}
                                    />
                                ))}
                            </TaskColumn>
                        );
                    })}
                </div>
            </div>
            {selectedTaskId && (
                <TaskDetailPanel
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </div>
    );
}
