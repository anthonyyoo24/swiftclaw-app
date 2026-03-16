import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AgentStatus } from "@/components/dashboard/AgentStatus";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function DashboardPage() {
    return (
        <div className="antialiased min-h-screen flex items-center justify-center sm:p-8 overflow-hidden text-white bg-black pt-4 pr-4 pb-4 pl-4 relative">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/50 to-black" />
                <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-200 h-200 rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse duration-4000" />
                </div>
                {/* Subtle dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                        backgroundSize: "24px 24px"
                    }}
                />
            </div>

            {/* App Window Container */}
            <div className="bg-[#09090b]/90 backdrop-blur-xl w-full max-w-350 rounded-[32px] shadow-2xl shadow-blue-900/10 border border-white/10 flex flex-col h-[90vh] min-h-175 relative z-10 overflow-hidden">
                <DashboardHeader />

                {/* Main Content Split */}
                <div className="flex flex-1 overflow-hidden relative">
                    <AppSidebar />
                    <AgentStatus />
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
