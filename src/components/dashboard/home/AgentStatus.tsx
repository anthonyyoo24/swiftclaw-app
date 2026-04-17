"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { AGENT_ROLES, AGENT_CRON_SCHEDULE } from "@/constants/ai-core";

const statusColors = {
    active: "bg-emerald-500",
    blocked: "bg-red-500",
    idle: "bg-neutral-500",
    paused: "bg-yellow-500",
} as const;

const pillStyles: Record<AgentStatusType, { base: string; active: string }> = {
    active:  { base: "border-emerald-500/30 text-emerald-400/60 hover:border-emerald-500/60 hover:text-emerald-400", active: "bg-emerald-500/15 border-emerald-500/60 text-emerald-400" },
    idle:    { base: "border-neutral-500/30 text-neutral-500/60 hover:border-neutral-500/60 hover:text-neutral-400", active: "bg-white/10 border-white/40 text-white" },
    paused:  { base: "border-yellow-500/30 text-yellow-500/60 hover:border-yellow-500/60 hover:text-yellow-400",   active: "bg-yellow-500/15 border-yellow-500/60 text-yellow-400" },
    blocked: { base: "border-red-500/30 text-red-400/60 hover:border-red-500/60 hover:text-red-400",               active: "bg-red-500/15 border-red-500/60 text-red-400" },
};

type AgentStatusType = keyof typeof statusColors;

const ALL_STATUSES: AgentStatusType[] = ["active", "idle", "paused", "blocked"];

interface AgentCardProps {
    name: string;
    agentName: string;
    agentId: Id<"agents">;
    role: string;
    status: AgentStatusType;
    currentTask: string;
    avatar?: string;
    roleEmojis: Record<string, string>;
    onToggle: (agentName: string, agentId: Id<"agents">, isPaused: boolean) => Promise<void>;
}

function AgentCard({ name, agentName, agentId, role, status, currentTask, avatar, roleEmojis, onToggle }: AgentCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isBlocked = status === "blocked";
    const isIdle = status === "idle";
    const isActive = status === "active";
    const isPaused = status === "paused";
    const emoji = roleEmojis[role] ?? "🤖";
    const hasCronSchedule = Boolean(AGENT_CRON_SCHEDULE[agentName]);

    async function handleToggleClick() {
        setIsLoading(true);
        try {
            await onToggle(agentName, agentId, isPaused);
        } finally {
            setIsLoading(false);
        }
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
                        onClick={handleToggleClick}
                        disabled={isLoading}
                        className={`shrink-0 p-1 rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isPaused ? "text-emerald-500 hover:text-emerald-400" : "text-neutral-500 hover:text-red-400"}`}
                        title={isPaused ? "Resume agent" : "Pause agent"}
                    >
                        <Icon
                            icon={isLoading ? "lucide:loader-circle" : isPaused ? "lucide:play" : "lucide:power"}
                            className={`text-[14px] ${isLoading ? "animate-spin" : ""}`}
                        />
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
        </div>
    );
}

export function AgentStatus({ roleEmojis }: { roleEmojis: Record<string, string> }) {
    const agents = useQuery(api.agents.get, {});
    const updateStatus = useMutation(api.agents.updateStatus);
    const [activeFilters, setActiveFilters] = useState<Set<AgentStatusType>>(new Set());

    function toggleFilter(status: AgentStatusType) {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(status)) {
                next.delete(status);
            } else {
                next.add(status);
            }
            return next;
        });
    }

    const visibleAgents = agents?.filter((a) =>
        activeFilters.size === 0 || activeFilters.has(a.status as AgentStatusType)
    );

    const statusCounts = agents?.reduce<Partial<Record<AgentStatusType, number>>>((acc, a) => {
        const s = a.status as AgentStatusType;
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
    }, {}) ?? {};

    async function handleToggle(agentName: string, agentId: Id<"agents">, isPaused: boolean) {
        if (!window.electron) return;
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

            {agents && agents.length > 0 && (
                <div className="px-3 pt-3 pb-1 flex flex-wrap gap-1.5">
                    {ALL_STATUSES.filter((s) => (statusCounts[s] ?? 0) > 0).map((status) => {
                        const isActive = activeFilters.has(status);
                        const styles = pillStyles[status];
                        return (
                            <button
                                key={status}
                                onClick={() => toggleFilter(status)}
                                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${isActive ? styles.active : styles.base}`}
                            >
                                {status} ({statusCounts[status]})
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {visibleAgents?.length ? (
                    visibleAgents.map((agent) => {
                        const dbStatus = agent.status as AgentStatusType;
                        const effectiveStatus: AgentStatusType =
                            agent.currentTaskId && dbStatus !== "paused" && dbStatus !== "blocked"
                                ? "active"
                                : dbStatus;
                        return (
                        <AgentCard
                            key={agent._id}
                            name={agent.name.charAt(0).toUpperCase() + agent.name.slice(1)}
                            agentName={agent.name}
                            agentId={agent._id}
                            role={agent.role}
                            status={effectiveStatus}
                            currentTask={agent.currentTaskId ? "Working on task..." : "Idle"}
                            avatar={AGENT_ROLES[agent.name]?.avatar}
                            roleEmojis={roleEmojis}
                            onToggle={handleToggle}
                        />
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 text-neutral-500">
                        <Icon icon="lucide:bot" className="text-2xl" />
                        <p className="text-sm">{agents?.length ? "No agents match filter" : "No agents deployed"}</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
