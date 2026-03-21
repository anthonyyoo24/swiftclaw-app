import { Icon } from "@iconify/react";

/** Agent status indicator dot colors */
const statusColors = {
    active: "bg-emerald-500",
    blocked: "bg-red-500",
    idle: "bg-neutral-500",
} as const;

type AgentStatus = keyof typeof statusColors;

interface AgentCardProps {
    name: string;
    role: string;
    status: AgentStatus;
    currentTask: string;
    iconName: string;
    colorClass: {
        bg: string;
        border: string;
        text: string;
    };
}

function AgentCard({ name, role, status, currentTask, iconName, colorClass }: AgentCardProps) {
    const isBlocked = status === "blocked";
    const isIdle = status === "idle";
    const isActive = status === "active";
    return (
        <div className={`p-3 rounded-xl border transition-all ${isActive ? "bg-white/5 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "hover:bg-white/5 border-transparent"}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl ${colorClass.bg} ${colorClass.border} ${colorClass.text} shrink-0`}>
                    <Icon icon={iconName} className="text-lg" />
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

export function AgentStatus() {
    return (
        <aside className="w-[300px] border-r border-white/5 bg-transparent hidden md:flex flex-col shrink-0 z-10">
            <div className="h-14 px-6 border-b border-white/5 flex items-center shrink-0">
                <h2 className="text-sm font-semibold text-white tracking-tight">Agent Status</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <AgentCard
                    name="Jarvis"
                    role="Squad Lead"
                    status="active"
                    currentTask="Orchestrating deployment"
                    iconName="lucide:bot"
                    colorClass={{ bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400" }}
                />
                <AgentCard
                    name="Friday"
                    role="Developer"
                    status="blocked"
                    currentTask="Blocked on PR review"
                    iconName="lucide:code-2"
                    colorClass={{ bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400" }}
                />
                <AgentCard
                    name="Karen"
                    role="Copywriter"
                    status="idle"
                    currentTask="Idle"
                    iconName="lucide:pen-tool"
                    colorClass={{ bg: "bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-400" }}
                />
            </div>
        </aside>
    );
}
