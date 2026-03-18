import { Icon } from "@iconify/react";

export type SkillTheme = 'blue' | 'orange' | 'emerald' | 'purple' | 'pink';

export interface Skill {
    id: string;
    title: string;
    description: string;
    icon: string;
    type: 'Default' | 'Custom';
    status: 'Active' | 'Disabled';
    theme: SkillTheme;
}

const themeStyles: Record<SkillTheme, { container: string, text: string }> = {
    blue: { container: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400" },
    orange: { container: "bg-orange-500/10 border-orange-500/20", text: "text-orange-400" },
    emerald: { container: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
    purple: { container: "bg-purple-500/10 border-purple-500/20", text: "text-purple-400" },
    pink: { container: "bg-pink-500/10 border-pink-500/20", text: "text-pink-400" },
};

interface SkillCardProps {
    skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
    const { container, text } = themeStyles[skill.theme] || themeStyles.blue;

    return (
        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.04] transition-colors relative group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${container} border flex items-center justify-center ${text}`}>
                    <Icon icon={skill.icon} className="text-lg" />
                </div>
                {skill.type === 'Default' ? (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-400">
                        Default
                    </span>
                ) : (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-medium text-purple-400">
                        Custom
                    </span>
                )}
            </div>

            <h4 className="text-sm font-semibold text-white mb-2 tracking-tight">
                {skill.title}
            </h4>

            <p className="text-xs text-neutral-400 leading-relaxed mb-6 flex-1">
                {skill.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                {skill.status === 'Active' ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <Icon icon="lucide:check-circle-2" className="text-xs" />
                        <span className="text-[11px] font-medium">Active</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-neutral-500">
                        <Icon icon="lucide:power" className="text-xs" />
                        <span className="text-[11px] font-medium">Disabled</span>
                    </div>
                )}
                <button className="text-neutral-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <Icon icon="lucide:settings-2" className="text-sm" />
                </button>
            </div>
        </div>
    );
}
