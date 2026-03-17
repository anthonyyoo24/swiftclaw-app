import { AuthGuard } from "@/components/guards/AuthGuard";
import { AppHeader } from "@/components/ui/AppHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div className="bg-[#09090b] w-full flex flex-col h-screen text-white font-sans relative overflow-hidden antialiased">
                <AppHeader subtitle="Workspace" className="pt-14 pb-5 drag" />

                {/* Main Content Split */}
                <div className="flex flex-1 overflow-hidden relative z-10 w-full border-t border-white/5">
                    <DashboardLayout>
                        {children}
                    </DashboardLayout>
                </div>
            </div>
        </AuthGuard>
    );
}
