import { ActivityFeed } from "@/components/dashboard/home/ActivityFeed";
import { AgentStatus } from "@/components/dashboard/home/AgentStatus";

export default function HomePage() {
    return (
        <>
            <AgentStatus />
            <ActivityFeed />
        </>
    );
}
