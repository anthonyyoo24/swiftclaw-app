import { AuthGuard } from "@/components/guards/AuthGuard";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div className="bg-[#09090b] w-full flex flex-col h-screen text-white font-sans relative overflow-hidden antialiased">
                <AppHeader subtitle="Workspace" className="px-6 sm:px-10 pt-14 pb-5 drag" />

                {/* Main Content Split */}
                <div className="flex flex-1 overflow-hidden relative z-10 w-full">
                    <AppSidebar />

                    {/* Page content — AgentStatus, ActivityFeed, etc. */}
                    {children}
                </div>
            </div>
        </AuthGuard>
    );
}
