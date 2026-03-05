"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WizardShell } from "@/components/ui/wizard/WizardShell";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIBrainStep } from "./steps/AIBrainStep";
import { ChannelSetupStep } from "./steps/ChannelSetupStep";
import { GatewayConnectionStep } from "./steps/GatewayConnectionStep";
import { onboardingSchema, type OnboardingFormValues, type SupportedChannelId } from "./schema";

const STEPS = [
    { title: "Welcome", description: "Get started with SwiftClaw" },
    { title: "AI Brain Selection", description: "Configure your LLM provider" },
    { title: "Communication Channel", description: "Setup external platforms" },
    { title: "Deploy AI", description: "Start your assistant" },
];

export function OnboardingWizard() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);
    const [isDeploying, setIsDeploying] = useState(false);
    const deployTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear the timer on unmount to avoid stale redirects or side effects
    useEffect(() => {
        return () => {
            if (deployTimeoutRef.current) {
                clearTimeout(deployTimeoutRef.current);
            }
        };
    }, []);

    const methods = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        mode: "onChange",
        defaultValues: {
            aiProvider: "",
            aiModel: "",
            aiApiKey: "",
            selectedChannel: undefined as unknown as SupportedChannelId,
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
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            setMaxVisitedIndex((prev) => Math.max(prev, nextIndex));
        }
    };

    const goBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    /**
     * Sidebar step click handler.
     * - Backward jumps (to a completed step) are ALWAYS allowed.
     * - Forward jumps require the current step to be valid AND the target
     *   must be within the already-visited range.
     */
    const handleStepClick = (index: number) => {
        if (isDeploying || index === currentStepIndex) return;

        const isBackward = index < currentStepIndex;
        if (isBackward) {
            setCurrentStepIndex(index);
            return;
        }

        // Forward: gate on current step validity and visited range.
        if (isCurrentStepValid && index <= maxVisitedIndex) {
            setCurrentStepIndex(index);
        }
    };

    const handleNextClick = () => {
        if (isDeploying || !isCurrentStepValid) return;
        if (currentStepIndex === STEPS.length - 1) {
            setIsDeploying(true);

            // Clear any existing timer just in case
            if (deployTimeoutRef.current) clearTimeout(deployTimeoutRef.current);

            deployTimeoutRef.current = setTimeout(() => {
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
                maxVisitedIndex={maxVisitedIndex}
                canProgress={isCurrentStepValid}
                isDeploying={isDeploying}
                onNext={handleNextClick}
                onBack={goBack}
                onStepClick={handleStepClick}
            >
                {renderStep()}
            </WizardShell>
        </FormProvider>
    );
}
