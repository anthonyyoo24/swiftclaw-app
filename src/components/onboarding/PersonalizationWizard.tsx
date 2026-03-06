"use client";

import { useState } from "react";
import { WizardShell } from "@/components/ui/wizard/WizardShell";

const STEPS = [
    { title: "Agent Identity", description: "Name and persona" },
    { title: "Knowledge Base", description: "What it knows" },
    { title: "Tone & Style", description: "How it speaks" },
    { title: "Final Polish", description: "Review and launch" },
];

export function PersonalizationWizard() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);

    // Placeholder: allow progression through all steps for now
    const isCurrentStepValid = true;

    const goNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            setMaxVisitedIndex((prev) => Math.max(prev, nextIndex));
        } else {
            // Finished personalization - redirect to dashboard
            window.location.href = "/";
        }
    };

    const goBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const handleStepClick = (index: number) => {
        if (index === currentStepIndex) return;

        const isBackward = index < currentStepIndex;
        if (isBackward) {
            setCurrentStepIndex(index);
            return;
        }

        if (isCurrentStepValid && index <= maxVisitedIndex) {
            setCurrentStepIndex(index);
        }
    };

    return (
        <WizardShell
            steps={STEPS}
            currentStepIndex={currentStepIndex}
            maxVisitedIndex={maxVisitedIndex}
            canProgress={isCurrentStepValid}
            onNext={goNext}
            onBack={goBack}
            onStepClick={handleStepClick}
        >
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col items-center justify-center p-8 text-center min-h-100">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                        {STEPS[currentStepIndex].title}
                    </h2>
                    <p className="text-neutral-400 max-w-sm">
                        This is a placeholder for the {STEPS[currentStepIndex].title.toLowerCase()} step content.
                        The form and specific inputs will go here.
                    </p>
                </div>
            </div>
        </WizardShell>
    );
}
