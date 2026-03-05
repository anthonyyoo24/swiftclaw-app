"use client";

import { Icon } from "@iconify/react";
import { WizardSidebar, WizardStep } from "./WizardSidebar";
import { WizardFooter } from "./WizardFooter";

interface WizardShellProps {
    /** Step metadata (title + description) for the sidebar. */
    steps: WizardStep[];
    currentStepIndex: number;
    /**
     * Derived from the specific wizard's validation — drives the footer "Next"
     * button. The shell is intentionally unaware of *why* a step is valid.
     */
    canProgress: boolean;
    isDeploying?: boolean;
    onNext: () => void;
    onBack: () => void;
    onStepClick?: (index: number) => void;
    /** The specific wizard's step content. */
    children: React.ReactNode;
}

/**
 * Generic layout shell for any multi-step wizard flow.
 * It handles the background, header, sidebar, footer layout,
 * but delegates all form state and validation logic to the specific wizard.
 */
export function WizardShell({
    steps,
    currentStepIndex,
    canProgress,
    isDeploying = false,
    onNext,
    onBack,
    onStepClick,
    children,
}: WizardShellProps) {
    return (
        <div className="bg-[#09090b] w-full flex flex-col h-screen text-white font-sans relative overflow-hidden">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/50 to-black" />
                <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-200 h-200 rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse duration-4000" />
                </div>
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
                />
            </div>

            {/* Header */}
            <header className="flex items-center justify-between px-6 sm:px-10 pt-14 pb-5 border-b border-white/5 bg-transparent z-10 shrink-0 drag">
                <div className="flex items-center gap-4 no-drag">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                        <Icon icon="solar:bolt-linear" className="text-lg" />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="font-medium text-sm text-white">SwiftClaw</span>
                        <span className="text-neutral-700">/</span>
                        <span className="text-neutral-400 font-medium text-sm">Setup Wizard</span>
                    </div>
                </div>
            </header>

            {/* Main Content Split */}
            <div className="flex flex-1 overflow-hidden z-10">
                <WizardSidebar steps={steps} currentStepIndex={currentStepIndex} onStepClick={onStepClick} />

                <main className="flex-1 p-8 sm:p-12 lg:p-16 overflow-y-auto flex flex-col bg-transparent">
                    <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col relative z-10">
                        {children}

                        <WizardFooter
                            currentStepIndex={currentStepIndex}
                            totalSteps={steps.length}
                            canProgress={canProgress}
                            isDeploying={isDeploying}
                            onBack={onBack}
                            onNext={onNext}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
