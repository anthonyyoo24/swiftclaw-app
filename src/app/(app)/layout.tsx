import { AuthGuard } from "@/components/guards/AuthGuard";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div className="antialiased min-h-screen flex items-center justify-center sm:p-8 overflow-hidden text-white bg-black pt-4 pr-4 pb-4 pl-4 relative">
                {/* App Window Container */}
                <div className="bg-[#09090b]/90 backdrop-blur-xl w-full max-w-350 rounded-[32px] shadow-2xl shadow-blue-900/10 border border-white/10 flex flex-col h-[90vh] min-h-175 relative z-10 overflow-hidden">
                    <AppHeader subtitle="Workspace" />

                    {/* Main Content Split */}
                    <div className="flex flex-1 overflow-hidden relative">
                        <AppSidebar />

                        {/* Page content — AgentStatus, ActivityFeed, etc. */}
                        {children}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
