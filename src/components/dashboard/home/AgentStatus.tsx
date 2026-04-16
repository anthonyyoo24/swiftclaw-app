"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { AGENT_ROLES, AGENT_CRON_SCHEDULE } from "@/constants/ai-core";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/Dialog";

const statusColors = {
    active: "bg-emerald-500",
    blocked: "bg-red-500",
    idle: "bg-neutral-500",
    paused: "bg-yellow-500",
} as const;

type AgentStatusType = keyof typeof statusColors;

interface AgentCardProps {
    name: string;
    agentName: string;
    agentId: Id<"agents">;
    role: string;
    status: AgentStatusType;
    currentTask: string;
    avatar?: string;
    roleEmojis: Record<string, string>;
    onToggle: (agentName: string, agentId: Id<"agents">, isPaused: boolean) => void;
}

function AgentCard({ name, agentName, agentId, role, status, currentTask, avatar, roleEmojis, onToggle }: AgentCardProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const isBlocked = status === "blocked";
    const isIdle = status === "idle";
    const isActive = status === "active";
    const isPaused = status === "paused";
    const emoji = roleEmojis[role] ?? "🤖";
    const hasCronSchedule = Boolean(AGENT_CRON_SCHEDULE[agentName]);

    function handleConfirm() {
        setDialogOpen(false);
        onToggle(agentName, agentId, isPaused);
    }

    return (
        <div className={`p-3 rounded-xl border transition-all ${isActive ? "bg-white/5 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "hover:bg-white/5 border-transparent"}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    {avatar ? (
                        <Image src={avatar} alt={name} fill className="object-cover rounded-xl" />
                    ) : (
                        <span className="text-lg">{emoji}</span>
                    )}
                    <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusColors[status]} border-2 border-[#09090b]`} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate">{name}</h3>
                    <p className="text-[11px] text-neutral-400 truncate">{role}</p>
                </div>
                {hasCronSchedule && (
                    <button
                        onClick={() => setDialogOpen(true)}
                        className={`shrink-0 p-1 rounded-md cursor-pointer transition-colors ${isPaused ? "text-emerald-500 hover:text-emerald-400" : "text-neutral-500 hover:text-red-400"}`}
                        title={isPaused ? "Resume agent" : "Pause agent"}
                    >
                        <Icon icon={isPaused ? "lucide:play" : "lucide:power"} className="text-[14px]" />
                    </button>
                )}
            </div>
            <div className={`rounded-lg p-2.5 border border-white/5 ${isActive ? "bg-black/50" : "bg-black/40"}`}>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 font-semibold">Current Status</p>
                {isBlocked ? (
                    <p className="text-xs text-red-400 truncate flex items-center gap-1.5">
                        <Icon icon="lucide:triangle-alert" className="text-[12px]" />
                        {currentTask}
                    </p>
                ) : isPaused ? (
                    <p className="text-xs text-yellow-600 italic truncate">Paused</p>
                ) : isIdle ? (
                    <p className="text-xs text-neutral-500 italic truncate">{currentTask}</p>
                ) : (
                    <p className="text-xs text-neutral-200 truncate">{currentTask}</p>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent showCloseButton={false} className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{isPaused ? `Resume ${name}?` : `Pause ${name}?`}</DialogTitle>
                        <DialogDescription>
                            {isPaused
                                ? `Re-adds ${name}'s scheduled heartbeat so they start processing tasks again.`
                                : `Stops ${name}'s scheduled heartbeat. They won't wake up or process tasks until resumed.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <button className="text-sm text-neutral-400 hover:text-white px-3 py-1.5 rounded-md transition-colors">
                                Cancel
                            </button>
                        </DialogClose>
                        <button
                            onClick={handleConfirm}
                            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${isPaused ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"}`}
                        >
                            {isPaused ? "Resume Agent" : "Pause Agent"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function AgentStatus({ roleEmojis }: { roleEmojis: Record<string, string> }) {
    const agents = useQuery(api.agents.get, {});
    const updateStatus = useMutation(api.agents.updateStatus);

    async function handleToggle(agentName: string, agentId: Id<"agents">, isPaused: boolean) {
        if (isPaused) {
            const result = await window.electron.ipcRenderer.resumeAgent(agentName);
            if (result.success) {
                await updateStatus({ id: agentId, status: "idle" });
                toast.success("Agent resumed");
            } else {
                const isGatewayDown = result.error?.includes("gateway closed") || result.error?.includes("gateway");
                toast.error(isGatewayDown ? "Gateway is offline — restart the app to reconnect" : `Failed to resume agent: ${result.error ?? "Unknown error"}`);
            }
        } else {
            await window.electron.ipcRenderer.pauseAgent(agentName);
            await updateStatus({ id: agentId, status: "paused" });
            toast.success("Agent paused");
        }
    }

    return (
        <aside className="w-75 border-r border-white/5 bg-transparent hidden md:flex flex-col shrink-0 z-10">
            <div className="h-14 px-6 border-b border-white/5 flex items-center shrink-0">
                <h2 className="text-sm font-semibold text-white tracking-tight">Agent Status</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {agents?.length ? (
                    agents.map((agent) => (
                        <AgentCard
                            key={agent._id}
                            name={agent.name.charAt(0).toUpperCase() + agent.name.slice(1)}
                            agentName={agent.name}
                            agentId={agent._id}
                            role={agent.role}
                            status={agent.status}
                            currentTask={agent.currentTaskId ? "Working on task..." : "Idle"}
                            avatar={AGENT_ROLES[agent.name]?.avatar}
                            roleEmojis={roleEmojis}
                            onToggle={handleToggle}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 text-neutral-500">
                        <Icon icon="lucide:bot" className="text-2xl" />
                        <p className="text-sm">No agents deployed</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
