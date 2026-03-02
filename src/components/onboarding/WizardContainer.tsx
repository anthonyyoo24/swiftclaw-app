"use client";

import { useState } from "react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIBrainStep } from "./steps/AIBrainStep";
import { ChannelSetupStep } from "./steps/ChannelSetupStep";
import { GatewayConnectionStep } from "./steps/GatewayConnectionStep";

const steps = [
    WelcomeStep,
    AIBrainStep,
    ChannelSetupStep,
    GatewayConnectionStep,
];

export function WizardContainer() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const CurrentStep = steps[currentStepIndex];

    const goNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        }
    };

    const goBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    // Skip wizard and redirect (MVP)
    const skipToDashboard = () => {
        localStorage.setItem("onboardingComplete", "true");
        window.location.href = "/";
    };

    const progressPercentage = ((currentStepIndex) / (steps.length - 1)) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Progress Bar Header */}
            <div className="bg-muted/50 p-4 border-b">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        Step {currentStepIndex + 1} of {steps.length}
                    </span>
                    {currentStepIndex > 0 && (
                        <button
                            onClick={skipToDashboard}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip
                        </button>
                    )}
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Step Content Area */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
                <CurrentStep onNext={goNext} onBack={goBack} onSkip={skipToDashboard} />
            </div>
        </div>
    );
}
