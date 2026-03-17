import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AgentStatus } from "@/components/dashboard/AgentStatus";

export default function HomePage() {
    return (
        <>
            <AgentStatus />
            <ActivityFeed />
        </>
    );
}
