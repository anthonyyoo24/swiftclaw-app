"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WizardShell } from "@/components/ui/wizard/WizardShell";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIBrainStep } from "./steps/AIBrainStep";
import { ChannelSetupStep } from "./steps/ChannelSetupStep";
import { GatewayConnectionStep } from "./steps/GatewayConnectionStep";
import { onboardingSchema, type OnboardingFormValues } from "./schema";

const STEPS = [
    { title: "Welcome", description: "Get started with SwiftClaw" },
    { title: "AI Brain Selection", description: "Configure your LLM provider" },
    { title: "Communication Channel", description: "Setup external platforms" },
    { title: "Deploy AI", description: "Start your assistant" },
];

export function OnboardingWizard() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isDeploying, setIsDeploying] = useState(false);

    const methods = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        mode: "onChange",
        defaultValues: {
            aiProvider: "",
            aiModel: "",
            aiApiKey: "",
            selectedChannel: "",
            channelToken: "",
        },
    });

    // useWatch subscribes only to these fields; the rest of the tree stays still.
    const [aiProvider, aiModel, aiApiKey, selectedChannel, channelToken] = useWatch({
        control: methods.control,
        name: ["aiProvider", "aiModel", "aiApiKey", "selectedChannel", "channelToken"],
    });

    /**
     * Derived validity — the single source of truth that feeds into WizardShell.
     * There is no `isValid` state to reset or forget; it is always computed fresh.
     */
    const isCurrentStepValid = useMemo((): boolean => {
        switch (currentStepIndex) {
            case 0: // Welcome — always allowed to proceed
                return true;
            case 1: // AI Brain
                return Boolean(aiProvider && aiModel && aiApiKey && aiApiKey.trim().length >= 5);
            case 2: // Channel Setup
                return Boolean(selectedChannel && channelToken && channelToken.trim().length >= 5);
            case 3: // Deploy — summary only, always allowed to deploy
                return true;
            default:
                return false;
        }
    }, [currentStepIndex, aiProvider, aiModel, aiApiKey, selectedChannel, channelToken]);

    const goNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        }
    };

    const goBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const handleNextClick = () => {
        if (!isCurrentStepValid) return;
        if (currentStepIndex === STEPS.length - 1) {
            setIsDeploying(true);
            setTimeout(() => {
                localStorage.setItem("onboardingComplete", "true");
                window.location.href = "/";
            }, 2000);
        } else {
            goNext();
        }
    };

    const renderStep = () => {
        switch (currentStepIndex) {
            case 0:
                return <WelcomeStep />;
            case 1:
                return <AIBrainStep />;
            case 2:
                return <ChannelSetupStep />;
            case 3:
                return (
                    <GatewayConnectionStep
                        aiProvider={aiProvider ?? ""}
                        aiModel={aiModel ?? ""}
                        selectedChannel={selectedChannel ?? ""}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <FormProvider {...methods}>
            <WizardShell
                steps={STEPS}
                currentStepIndex={currentStepIndex}
                canProgress={isCurrentStepValid}
                isDeploying={isDeploying}
                onNext={handleNextClick}
                onBack={goBack}
            >
                {renderStep()}
            </WizardShell>
        </FormProvider>
    );
}
