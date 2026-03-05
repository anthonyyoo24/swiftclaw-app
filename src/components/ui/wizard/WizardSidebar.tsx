import { Icon } from "@iconify/react";

export interface WizardStep {
    title: string;
    description: string;
}

interface WizardSidebarProps {
    steps: WizardStep[];
    currentStepIndex: number;
    maxVisitedIndex: number;
    canProgress: boolean;
    onStepClick?: (index: number) => void;
}

export function WizardSidebar({ steps, currentStepIndex, maxVisitedIndex, canProgress, onStepClick }: WizardSidebarProps) {
    return (
        <aside className="w-[320px] border-r border-white/5 bg-linear-to-br from-white/2 to-transparent px-10 pt-14 pb-10 hidden lg:block overflow-y-auto shrink-0">
            <nav className="relative pt-8">
                {steps.map((step, index) => {
                    // A step is "done" if we've either passed it or previously reached it.
                    const isDone = index < currentStepIndex || (index > currentStepIndex && index <= maxVisitedIndex);
                    const isActive = index === currentStepIndex;

                    // Locked Forward: even if it's "done" (previously visited), 
                    // if we are currently at an earlier step that is invalid, 
                    // we cannot navigate forward.
                    const isLockedForward = index > currentStepIndex && (!canProgress || index > maxVisitedIndex);

                    const isClickable = isDone && !isActive && !isLockedForward;

                    const stepEl = (
                        <>
                            {/* Line connecting steps */}
                            {index !== steps.length - 1 && (
                                <div className={`absolute left-3 top-8 -bottom-2 w-px transition-colors ${isDone ? (isLockedForward ? "bg-white/5" : "bg-white/10") : "bg-white/5"}`} />
                            )}

                            {/* Step Circle */}
                            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium transition-all ${isDone
                                    ? isLockedForward
                                        ? "bg-white/40 text-black/60 shadow-none scale-95"
                                        : "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:scale-110"
                                    : isActive
                                        ? "border border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                        : "border border-white/10 bg-[#131316] text-neutral-500"
                                }`}>
                                {isDone ? <Icon icon="solar:check-read-linear" className="text-sm" /> : index + 1}
                            </div>

                            {/* Step Text */}
                            <div className={isLockedForward ? "opacity-60" : ""}>
                                <h3 className={`font-medium text-sm transition-colors ${isActive
                                        ? "text-white"
                                        : isDone
                                            ? isLockedForward ? "text-white/70" : "text-white/80 group-hover:text-white"
                                            : "text-neutral-500"
                                    }`}>
                                    {step.title}
                                </h3>
                                <p className={`text-xs mt-1 transition-colors ${isDone
                                        ? isLockedForward ? "text-neutral-500" : "text-neutral-500 group-hover:text-neutral-400"
                                        : isActive
                                            ? "text-neutral-400"
                                            : "text-neutral-600"
                                    }`}>
                                    {step.description}
                                </p>
                            </div>
                        </>
                    );

                    if (isClickable) {
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => onStepClick?.(index)}
                                className={`flex gap-4 relative group w-full text-left cursor-pointer ${index !== steps.length - 1 ? "pb-10" : ""}`}
                            >
                                {stepEl}
                            </button>
                        );
                    }

                    return (
                        <div key={index} className={`flex gap-4 relative ${index !== steps.length - 1 ? "pb-10" : ""} ${isLockedForward ? "cursor-not-allowed" : ""}`}>
                            {stepEl}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
