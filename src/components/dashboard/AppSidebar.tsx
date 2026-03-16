import { Icon } from "@iconify/react";

export function AppSidebar() {
    return (
        <aside className="w-[220px] border-r border-white/5 bg-white/[0.01] p-4 hidden lg:flex flex-col gap-1 z-10">
            <nav className="flex-1 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm transition-colors border border-white/5 shadow-sm">
                    <Icon icon="solar:home-2-linear" className="text-[18px] text-white" />
                    Home
                </button>
                <button className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all">
                    <Icon icon="solar:calendar-mark-linear" className="text-[18px] group-hover:text-white transition-colors" />
                    Scheduler
                </button>
                <button className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all">
                    <Icon icon="solar:cpu-linear" className="text-[18px] group-hover:text-white transition-colors" />
                    Skills
                </button>
            </nav>

            <div className="mt-auto">
                <button className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all">
                    <Icon icon="solar:settings-linear" className="text-[18px] group-hover:text-white transition-colors" />
                    Settings
                </button>
            </div>
        </aside>
    );
}
