"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIBrainStep } from "./steps/AIBrainStep";
import { ChannelSetupStep } from "./steps/ChannelSetupStep";
import { GatewayConnectionStep } from "./steps/GatewayConnectionStep";

const steps = [
    { component: WelcomeStep, title: "Welcome", description: "Get started with SwiftClaw" },
    { component: AIBrainStep, title: "AI Brain Selection", description: "Configure your LLM provider" },
    { component: ChannelSetupStep, title: "Communication Channel", description: "Setup external platforms" },
    { component: GatewayConnectionStep, title: "Deploy AI", description: "Start your assistant" },
];

export function WizardContainer() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const CurrentStep = steps[currentStepIndex].component;

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

    // Complete wizard and redirect
    const completeOnboarding = () => {
        localStorage.setItem("onboardingComplete", "true");
        window.location.href = "/";
    };

    return (
        <div className="bg-[#09090b] w-full flex flex-col h-screen text-white font-sans relative overflow-hidden">
            {/* Background effects from current template style */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
                <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-[50rem] h-[50rem] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse duration-[4000ms]">
                    </div>
                </div>
                {/* Subtle dot grid */}
                <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                </div>
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
                {/* Sidebar Navigation */}
                <aside className="w-[320px] border-r border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent px-10 pt-14 pb-10 hidden lg:block overflow-y-auto shrink-0">
                    <nav className="relative pt-8">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isActive = index === currentStepIndex;

                            return (
                                <div key={index} className={`flex gap-4 relative group ${index !== steps.length - 1 ? 'pb-10' : ''}`}>
                                    {/* Line connecting steps */}
                                    {index !== steps.length - 1 && (
                                        <div className={`absolute left-3 top-8 -bottom-2 w-px ${isCompleted ? 'bg-white/10' : 'bg-white/5'}`}></div>
                                    )}

                                    {/* Step Circle */}
                                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium transition-colors ${isCompleted ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' :
                                        isActive ? 'border border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' :
                                            'border border-white/10 bg-[#131316] text-neutral-500 group-hover:border-white/30 group-hover:text-neutral-300'
                                        }`}>
                                        {isCompleted ? <Icon icon="solar:check-read-linear" className="text-sm" /> : index + 1}
                                    </div>

                                    {/* Step Text */}
                                    <div>
                                        <h3 className={`font-medium text-sm transition-colors ${isCompleted ? 'text-white' :
                                            isActive ? 'text-white' :
                                                'text-neutral-500 group-hover:text-neutral-300'
                                            }`}>
                                            {step.title}
                                        </h3>
                                        <p className={`text-xs mt-1 ${isCompleted ? 'text-neutral-500' : isActive ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Form Area */}
                <main className="flex-1 p-8 sm:p-12 lg:p-16 overflow-y-auto flex flex-col bg-transparent">
                    <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col relative z-10">
                        <CurrentStep onNext={goNext} onBack={goBack} onComplete={completeOnboarding} />
                    </div>
                </main>
            </div>
        </div>
    );
}
