import React from "react";

export interface TaskColumnProps {
    title: string;
    count: number;
    children: React.ReactNode;
    isDimmed?: boolean;
}

export function TaskColumn({ title, count, children, isDimmed = false }: TaskColumnProps) {
    return (
        <div className={`w-[230px] shrink-0 flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-2xl ${isDimmed ? 'opacity-70' : ''}`}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white tracking-tight">
                        {title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-neutral-300">
                        {count}
                    </span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {children}
            </div>
        </div>
    );
}
