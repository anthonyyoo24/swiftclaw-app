import { Icon } from "@iconify/react";

type FeedItemType = "started" | "blocked" | "completed" | "message";

interface FeedItem {
    id: string;
    agentName: string;
    eventType: string;
    description: React.ReactNode;
    timestamp: string;
    type: FeedItemType;
}

const typeStyles: Record<FeedItemType, { bg: string; border: string; text: string; icon: string }> = {
    started: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: "lucide:play" },
    blocked: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: "lucide:triangle-alert" },
    completed: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: "lucide:file-text" },
    message: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", icon: "lucide:message-square" },
};

const FEED_ITEMS: FeedItem[] = [
    {
        id: "1",
        agentName: "Jarvis",
        eventType: "Task Started",
        type: "started",
        timestamp: "2 min ago",
        description: (
            <>
                Jarvis started working on{" "}
                <span className="text-white font-medium">Orchestrating deployment pipeline</span>.
            </>
        ),
    },
    {
        id: "2",
        agentName: "Friday",
        eventType: "Blocked",
        type: "blocked",
        timestamp: "15 min ago",
        description: (
            <>
                Friday marked <span className="text-white font-medium">Feature Implementation</span>{" "}
                as blocked:{" "}
                <span className="italic text-red-400">Waiting for PR review on #342</span>.
            </>
        ),
    },
    {
        id: "3",
        agentName: "Karen",
        eventType: "Document Created",
        type: "completed",
        timestamp: "1 hour ago",
        description: (
            <>
                Karen completed and published{" "}
                <span className="text-white font-medium">Landing Page Copy v2</span>.
            </>
        ),
    },
    {
        id: "4",
        agentName: "Friday",
        eventType: "Message Sent",
        type: "message",
        timestamp: "2 hours ago",
        description: (
            <>
                Friday sent a message in{" "}
                <span className="text-white font-medium">Engineering Channel</span>:{" "}
                &quot;I&apos;ve pushed the initial commit for the new dashboard component.&quot;
            </>
        ),
    },
];

function FeedItemCard({ item, isLast }: { item: FeedItem; isLast: boolean }) {
    const styles = typeStyles[item.type];
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
                                {item.eventType}
                            </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-medium">{item.timestamp}</span>
                    </div>
                    <p className="text-[13px] text-neutral-300 leading-relaxed">{item.description}</p>
                </div>
            </div>
        </div>
    );
}

export function ActivityFeed() {
    return (
        <main className="flex-1 flex flex-col bg-transparent relative min-w-0">
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center px-6 shrink-0 bg-white/[0.01] backdrop-blur-sm z-10">
                <h3 className="text-sm font-semibold text-white tracking-tight">Activity Feed</h3>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <div className="max-w-3xl">
                    {FEED_ITEMS.map((item, index) => (
                        <FeedItemCard key={item.id} item={item} isLast={index === FEED_ITEMS.length - 1} />
                    ))}
                </div>
            </div>
        </main>
    );
}
