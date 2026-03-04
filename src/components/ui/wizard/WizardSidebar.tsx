import { Icon } from "@iconify/react";

export interface WizardStep {
    title: string;
    description: string;
}

interface WizardSidebarProps {
    steps: WizardStep[];
    currentStepIndex: number;
}

export function WizardSidebar({ steps, currentStepIndex }: WizardSidebarProps) {
    return (
        <aside className="w-[320px] border-r border-white/5 bg-linear-to-br from-white/2 to-transparent px-10 pt-14 pb-10 hidden lg:block overflow-y-auto shrink-0">
            <nav className="relative pt-8">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isActive = index === currentStepIndex;

                    return (
                        <div key={index} className={`flex gap-4 relative group ${index !== steps.length - 1 ? "pb-10" : ""}`}>
                            {/* Line connecting steps */}
                            {index !== steps.length - 1 && (
                                <div className={`absolute left-3 top-8 -bottom-2 w-px ${isCompleted ? "bg-white/10" : "bg-white/5"}`} />
                            )}

                            {/* Step Circle */}
                            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium transition-colors ${isCompleted
                                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                : isActive
                                    ? "border border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                    : "border border-white/10 bg-[#131316] text-neutral-500 group-hover:border-white/30 group-hover:text-neutral-300"
                                }`}>
                                {isCompleted ? <Icon icon="solar:check-read-linear" className="text-sm" /> : index + 1}
                            </div>

                            {/* Step Text */}
                            <div>
                                <h3 className={`font-medium text-sm transition-colors ${isCompleted || isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"
                                    }`}>
                                    {step.title}
                                </h3>
                                <p className={`text-xs mt-1 ${isCompleted ? "text-neutral-500" : isActive ? "text-neutral-400" : "text-neutral-600"
                                    }`}>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
