import { Icon } from "@iconify/react";

export function TasksHeader() {
    return (
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-white/1 backdrop-blur-sm z-10">
            <h3 className="text-sm font-semibold text-white tracking-tight">
                Tasks
            </h3>
            <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/5"
            >
                <Icon icon="lucide:plus" className="text-sm" />
                New Task
            </button>
        </header>
    );
}
