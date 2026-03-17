"use client";

import { Icon } from "@iconify/react";
import { AppHeader } from "@/components/ui/AppHeader";
import { WizardSidebar, WizardStep } from "./WizardSidebar";
import { WizardFooter } from "./WizardFooter";

export interface WizardShellProps {
    /** Step metadata (title + description) for the sidebar. */
    steps: WizardStep[];
    currentStepIndex: number;
    maxVisitedIndex: number;
    /**
     * Derived from the specific wizard's validation — drives the footer "Next"
     * button. The shell is intentionally unaware of *why* a step is valid.
     */
    canProgress: boolean;
    isDeploying?: boolean;
    deployState?: 'idle' | 'loading' | 'success';
    onNext: () => void;
    onBack: () => void;
    onStepClick?: (index: number) => void;
    /** Called when the user confirms they want to reset the entire wizard. */
    onReset?: () => void;
    /** The specific wizard's step content. */
    children: React.ReactNode;
    /** Optional title to show in the header. Defaults to "Setup Wizard" */
    title?: string;
    /** The action style to use for the final step button */
    submitAction?: 'deploy' | 'save';
}

/**
 * Generic layout shell for any multi-step wizard flow.
 * It handles the background, header, sidebar, footer layout,
 * but delegates all form state and validation logic to the specific wizard.
 */
export function WizardShell({
    steps,
    currentStepIndex,
    maxVisitedIndex,
    canProgress,
    isDeploying = false,
    deployState = 'idle',
    onNext,
    onBack,
    onStepClick,
    onReset,
    children,
    title = "Setup Wizard",
    submitAction = 'deploy',
}: WizardShellProps) {
    return (
        <div className="bg-[#09090b] opacity-[0.99] w-full flex flex-col h-screen text-white font-sans relative overflow-hidden">
            {/* Background effects */}
            {/* <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/50 to-black" />
                <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-[50rem] h-[50rem] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse duration-[4000ms]" />
                </div>
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
                />
            </div> */}

            <AppHeader
                subtitle={title}
                className="px-6 sm:px-10 pt-14 pb-5 drag"
                rightSlot={
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm("Are you sure you want to reset the wizard? All entered progress and credentials will be cleared.")) {
                                onReset?.();
                            }
                        }}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer no-drag"
                        title="Reset Wizard"
                    >
                        <Icon
                            icon="solar:restart-linear"
                            className="text-lg text-neutral-500 group-hover:text-white group-hover:-rotate-45 transition-all duration-300"
                        />
                        <span className="text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
                            Reset
                        </span>
                    </button>
                }
            />

            {/* Main Content Split */}
            <div className="flex flex-1 overflow-hidden z-10">
                <WizardSidebar
                    steps={steps}
                    currentStepIndex={currentStepIndex}
                    maxVisitedIndex={maxVisitedIndex}
                    canProgress={canProgress}
                    onStepClick={onStepClick}
                />

                <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto px-8 sm:px-12 lg:px-16 pt-8 sm:pt-12 lg:pt-16 pb-8">
                        <div className="max-w-2xl w-full mx-auto relative z-10">
                            {children}
                        </div>
                    </div>

                    {/* Footer pinned to the bottom of the right pane */}
                    {(deployState === 'idle') && (
                        <div className="shrink-0 px-8 sm:px-12 lg:px-16 pb-8 bg-transparent">
                            <div className="max-w-2xl w-full mx-auto">
                                <WizardFooter
                                    currentStepIndex={currentStepIndex}
                                    totalSteps={steps.length}
                                    canProgress={canProgress}
                                    isDeploying={isDeploying}
                                    onBack={onBack}
                                    onNext={onNext}
                                    submitAction={submitAction}
                                />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
