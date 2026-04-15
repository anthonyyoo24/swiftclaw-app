"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Icon } from "@iconify/react";
import { AGENT_ROLES } from "@/constants/ai-core";

const statusColors = {
    active: "bg-emerald-500",
    blocked: "bg-red-500",
    idle: "bg-neutral-500",
} as const;

type AgentStatusType = keyof typeof statusColors;

interface AgentCardProps {
    name: string;
    role: string;
    status: AgentStatusType;
    currentTask: string;
    avatar?: string;
    roleEmojis: Record<string, string>;
}

function AgentCard({ name, role, status, currentTask, avatar, roleEmojis }: AgentCardProps) {
    const isBlocked = status === "blocked";
    const isIdle = status === "idle";
    const isActive = status === "active";
    const emoji = roleEmojis[role] ?? "🤖";

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
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{name}</h3>
                    <p className="text-[11px] text-neutral-400 truncate">{role}</p>
                </div>
            </div>
            <div className={`rounded-lg p-2.5 border border-white/5 ${isActive ? "bg-black/50" : "bg-black/40"}`}>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 font-semibold">Current Task</p>
                {isBlocked ? (
                    <p className="text-xs text-red-400 truncate flex items-center gap-1.5">
                        <Icon icon="lucide:triangle-alert" className="text-[12px]" />
                        {currentTask}
                    </p>
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
                            role={agent.role}
                            status={agent.status}
                            currentTask={agent.currentTaskId ? "Working on task..." : "Idle"}
                            avatar={AGENT_ROLES[agent.name]?.avatar}
                            roleEmojis={roleEmojis}
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
