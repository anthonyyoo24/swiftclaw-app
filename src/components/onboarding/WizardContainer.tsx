"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIBrainStep } from "./steps/AIBrainStep";
import { ChannelSetupStep } from "./steps/ChannelSetupStep";
import { GatewayConnectionStep } from "./steps/GatewayConnectionStep";
import { WizardSidebar } from "./WizardSidebar";
import { WizardFooter } from "./WizardFooter";

const steps = [
    { component: WelcomeStep, title: "Welcome", description: "Get started with SwiftClaw" },
    { component: AIBrainStep, title: "AI Brain Selection", description: "Configure your LLM provider" },
    { component: ChannelSetupStep, title: "Communication Channel", description: "Setup external platforms" },
    { component: GatewayConnectionStep, title: "Deploy AI", description: "Start your assistant" },
];

export function WizardContainer() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isValid, setIsValid] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);

    const CurrentStep = steps[currentStepIndex].component;

    const goNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setIsValid(true);
            setCurrentStepIndex((prev) => prev + 1);
        }
    };

    const goBack = () => {
        if (currentStepIndex > 0) {
            setIsValid(true);
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const completeOnboarding = () => {
        localStorage.setItem("onboardingComplete", "true");
        window.location.href = "/";
    };

    const handleNextClick = () => {
        if (!isValid) return;
        if (currentStepIndex === steps.length - 1) {
            setIsDeploying(true);
            setTimeout(() => {
                completeOnboarding();
            }, 2000);
        } else {
            goNext();
        }
    };

    return (
        <div className="bg-[#09090b] w-full flex flex-col h-screen text-white font-sans relative overflow-hidden">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
                <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-[50rem] h-[50rem] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse duration-[4000ms]" />
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
                <WizardSidebar steps={steps} currentStepIndex={currentStepIndex} />

                <main className="flex-1 p-8 sm:p-12 lg:p-16 overflow-y-auto flex flex-col bg-transparent">
                    <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col relative z-10">
                        <CurrentStep setIsValid={setIsValid} />

                        <WizardFooter
                            currentStepIndex={currentStepIndex}
                            totalSteps={steps.length}
                            isValid={isValid}
                            isDeploying={isDeploying}
                            onBack={goBack}
                            onNext={handleNextClick}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
