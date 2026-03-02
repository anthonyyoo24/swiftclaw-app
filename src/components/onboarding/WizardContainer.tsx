"use client";

import { useState } from "react";
import { Zap, Check } from "lucide-react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIBrainStep } from "./steps/AIBrainStep";
import { ChannelSetupStep } from "./steps/ChannelSetupStep";
import { GatewayConnectionStep } from "./steps/GatewayConnectionStep";

const steps = [
    { component: WelcomeStep, title: "Welcome", description: "Get started with SwiftClaw" },
    { component: AIBrainStep, title: "AI Brain Selection", description: "Configure your LLM provider" },
    { component: ChannelSetupStep, title: "Communication Channel", description: "Setup external platforms" },
    { component: GatewayConnectionStep, title: "Connection", description: "Verify Gateway connection" },
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
        <div className="bg-white w-full flex flex-col h-screen text-gray-900 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-6 sm:px-10 pt-14 pb-5 border-b border-gray-100 bg-white z-10 shrink-0 drag">
                <div className="flex items-center gap-4 no-drag">
                    <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center text-white">
                        <Zap className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-base">SwiftClaw</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-500 font-medium text-base">Setup Wizard</span>
                    </div>
                </div>
            </header>

            {/* Main Content Split */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-[320px] border-r border-gray-100 bg-[#fdfdfd] px-10 pt-14 pb-10 hidden lg:block overflow-y-auto shrink-0">
                    <nav className="relative pt-8">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isActive = index === currentStepIndex;

                            return (
                                <div key={index} className={`flex gap-4 relative group ${index !== steps.length - 1 ? 'pb-10' : ''}`}>
                                    {/* Line connecting steps */}
                                    {index !== steps.length - 1 && (
                                        <div className={`absolute left-3 top-8 -bottom-2 w-px ${isCompleted ? 'bg-gray-200' : 'bg-gray-100'}`}></div>
                                    )}

                                    {/* Step Circle */}
                                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium transition-colors ${isCompleted ? 'bg-gray-900 text-white' :
                                        isActive ? 'bg-gray-900 text-white' :
                                            'border border-gray-200 bg-white text-gray-400 group-hover:border-gray-300'
                                        }`}>
                                        {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : index + 1}
                                    </div>

                                    {/* Step Text */}
                                    <div>
                                        <h3 className={`font-medium text-base transition-colors ${isCompleted || isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
                                            }`}>
                                            {step.title}
                                        </h3>
                                        <p className={`text-sm mt-1 ${isCompleted || isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Form Area */}
                <main className="flex-1 p-8 sm:p-12 lg:p-16 overflow-y-auto flex flex-col bg-white">
                    <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
                        <CurrentStep onNext={goNext} onBack={goBack} onComplete={completeOnboarding} />
                    </div>
                </main>
            </div>
        </div>
    );
}
