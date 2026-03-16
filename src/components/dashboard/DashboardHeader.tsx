import { Icon } from "@iconify/react";

export function DashboardHeader() {
    return (
        <header className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-white/5 bg-transparent z-20 shrink-0">
            <div className="flex items-center gap-4">
                {/* App Logo */}
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    <Icon icon="solar:bolt-linear" className="text-lg" />
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="font-medium text-sm text-white">SwiftClaw</span>
                    <span className="text-neutral-700">/</span>
                    <span className="text-neutral-400 font-medium text-sm">Workspace</span>
                </div>
            </div>
        </header>
    );
}
