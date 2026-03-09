import { Icon } from "@iconify/react";

interface WizardFooterProps {
    currentStepIndex: number;
    totalSteps: number;
    /** Derived from the specific wizard's validation logic — replaces the old `isValid` state. */
    canProgress: boolean;
    isDeploying: boolean;
    onBack: () => void;
    onNext: () => void;
}

export function WizardFooter({
    currentStepIndex,
    totalSteps,
    canProgress,
    isDeploying,
    onBack,
    onNext,
}: WizardFooterProps) {
    const isLastStep = currentStepIndex === totalSteps - 1;

    return (
        <div className="mt-auto pt-8 border-t border-white/5 flex gap-4 items-center justify-between">
            {currentStepIndex > 0 ? (
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isDeploying}
                    className="group px-6 py-2.5 rounded-full text-sm font-medium border border-white/10 text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus:ring-white/20 active:scale-[0.98] active:ring-2 active:ring-white/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                    <Icon icon="solar:arrow-left-linear" className="text-lg transition-transform group-hover:-translate-x-0.5" />
                    Back
                </button>
            ) : (
                <div />
            )}

            <button
                type="button"
                onClick={onNext}
                disabled={!canProgress || isDeploying}
                className={
                    isLastStep
                        ? "group relative inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus:ring-white/20 active:scale-[0.98] active:ring-2 active:ring-white/20 transition-all overflow-hidden disabled:opacity-80 disabled:cursor-wait cursor-pointer ml-auto"
                        : "disabled:opacity-50 disabled:cursor-not-allowed group inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus:ring-white/20 active:scale-[0.98] active:ring-2 active:ring-white/20 transition-all ml-auto cursor-pointer"
                }
            >
                {isLastStep ? (
                    <>
                        <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10 flex items-center gap-2" aria-live="polite">
                            {isDeploying ? "Deploying..." : "Deploy Agent"}
                            {!isDeploying && (
                                <Icon icon="solar:rocket-linear" className="text-lg transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            )}
                            {isDeploying && (
                                <Icon icon="solar:refresh-linear" className="text-lg animate-spin" />
                            )}
                        </span>
                    </>
                ) : (
                    <>
                        Continue
                        <Icon icon="solar:arrow-right-linear" className="text-lg transition-transform group-hover:translate-x-0.5" />
                    </>
                )}
            </button>
        </div>
    );
}
