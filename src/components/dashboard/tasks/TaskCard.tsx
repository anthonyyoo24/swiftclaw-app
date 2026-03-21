import { Icon } from "@iconify/react";

export type TagColor = 'red' | 'blue' | 'purple' | 'orange' | 'emerald' | 'neutral';

export interface TaskCardProps {
    tagLabel: string;
    tagColor: TagColor;
    title: string;
    date: string;
    comments?: number;
    assigneeIcon: string;
    assigneeColor?: TagColor;
    hasOptions?: boolean;
    isDone?: boolean;
}

const colorStyles: Record<TagColor, { tag: string; iconBg: string }> = {
    red: { tag: "bg-red-500/10 text-red-400 border-red-500/20", iconBg: "bg-red-500/20 border-red-500/30 text-red-400" },
    blue: { tag: "bg-blue-500/10 text-blue-400 border-blue-500/20", iconBg: "bg-blue-500/20 border-blue-500/30 text-blue-400" },
    purple: { tag: "bg-purple-500/10 text-purple-400 border-purple-500/20", iconBg: "bg-purple-500/20 border-purple-500/30 text-purple-400" },
    orange: { tag: "bg-orange-500/10 text-orange-400 border-orange-500/20", iconBg: "bg-orange-500/20 border-orange-500/30 text-orange-400" },
    emerald: { tag: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", iconBg: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" },
    neutral: { tag: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20", iconBg: "bg-white/10 border-white/20 border-dashed text-neutral-400" },
};

export function TaskCard({ 
    tagLabel, 
    tagColor, 
    title, 
    date, 
    comments, 
    assigneeIcon, 
    assigneeColor = 'neutral',
    hasOptions = false,
    isDone = false
}: TaskCardProps) {
    const styles = colorStyles[tagColor];
    const iconStyles = colorStyles[assigneeColor].iconBg;

    return (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shadow-sm flex flex-col min-h-30">
            <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${styles.tag}`}>
                    {tagLabel}
                </span>
                {hasOptions && (
                    <Icon icon="lucide:more-horizontal" className="text-neutral-500 hover:text-white transition-colors" />
                )}
            </div>
            <p className={`text-[13px] font-medium mb-3 ${isDone ? 'text-neutral-400 line-through' : 'text-white'}`}>
                {title}
            </p>
            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3 text-neutral-500">
                    <div className="flex items-center gap-1.5">
                        <Icon icon="lucide:calendar" className="text-[10px]" />
                        <span className="text-[11px] font-medium">{date}</span>
                    </div>
                    {typeof comments === 'number' && (
                        <div className="flex items-center gap-1.5">
                            <Icon icon="lucide:message-square" className="text-[11px]" />
                            <span className="text-[11px] font-medium">{comments}</span>
                        </div>
                    )}
                </div>
                <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${iconStyles}`}>
                    <Icon icon={assigneeIcon} className="text-[10px]" />
                </div>
            </div>
        </div>
    );
}
