"use client";

import { Icon } from "@iconify/react";

interface SkillsHeaderProps {
    onNewSkill: () => void;
}

export function SkillsHeader({ onNewSkill }: SkillsHeaderProps) {
    return (
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-white/[0.01] backdrop-blur-sm z-10">
            <h3 className="text-sm font-semibold text-white tracking-tight">
                Skills
            </h3>
            <button
                onClick={onNewSkill}
                className="flex items-center cursor-pointer gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/5"
            >
                <Icon icon="lucide:plus" className="text-sm" />
                New Skill
            </button>
        </div>
    );
}
