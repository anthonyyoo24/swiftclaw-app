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
        <div className="text-center space-y-2 mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-xl mx-auto mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <Icon icon={icon} className="text-2xl text-neutral-300" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-neutral-400">{description}</p>
        </div>
    );
}
