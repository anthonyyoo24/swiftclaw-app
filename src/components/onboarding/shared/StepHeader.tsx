import { Icon } from "@iconify/react";

interface StepHeaderProps {
    icon: string;
    title: string;
    description: string;
}

/**
 * Reusable header block for each onboarding wizard step.
 * Renders an icon badge, a large title, and a short description paragraph.
 */
export function StepHeader({ icon, title, description }: StepHeaderProps) {
    return (
        <div className="mb-12">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <Icon icon={icon} className="text-2xl text-neutral-300" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">{title}</h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">{description}</p>
        </div>
    );
}
