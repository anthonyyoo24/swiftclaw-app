"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WizardShell } from "@/components/ui/wizard/WizardShell";

import { onboardingSchema, type OnboardingFormValues, type AgentTemplateId } from "./schema";

// Setup Steps
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIBrainStep } from "./steps/AIBrainStep";
import { ChannelSetupStep } from "./steps/ChannelSetupStep";
import { DeploymentStep } from "./steps/DeploymentStep";
import { DeployProgressView } from "./steps/DeployProgressView";
import { DeploySuccessView } from "./steps/DeploySuccessView";

// Personalization Steps
import { UsageTypeStep } from "./steps/UsageTypeStep";
import { UserNameStep } from "./steps/UserNameStep";
import { TimezoneStep } from "./steps/TimezoneStep";
import { BusinessUseStep } from "./steps/BusinessUseStep";
import { GoalsStep } from "./steps/GoalsStep";
import { WorkflowsStep } from "./steps/WorkflowsStep";
import { ToolsStep } from "./steps/ToolsStep";
import { CharacterSelectionView } from "./steps/CharacterSelectionView";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

type StepId =
    | "welcome"
    | "usage-type"
    | "user-name"
    | "timezone"
    | "business-use"
    | "goals"
    | "workflows"
    | "tools"
    | "character"
    | "ai-brain"
    | "channel-setup"
    | "deploy";

interface StepConfig {
    id: StepId;
    title: string;
    description: string;
}

const BASE_STEPS: StepConfig[] = [
    { id: "welcome", title: "Welcome", description: "Get started with SwiftClaw" },
    { id: "usage-type", title: "Usage", description: "Business or personal?" },
    { id: "user-name", title: "Your Name", description: "How should we address you?" },
    { id: "timezone", title: "Timezone", description: "Where are you based?" },
    { id: "goals", title: "Goals", description: "What do you want to achieve?" },
    { id: "workflows", title: "Workflows", description: "What will your agent handle?" },
    { id: "tools", title: "Tools", description: "What's in your stack?" },
    { id: "character", title: "Character", description: "Meet your agent" },
    { id: "ai-brain", title: "AI Brain Selection", description: "Configure your LLM provider" },
    { id: "channel-setup", title: "Communication Channel", description: "Setup external platforms" },
    { id: "deploy", title: "Deploy AI", description: "Start your assistant" },
];

const BUSINESS_STEP: StepConfig = {
    id: "business-use",
    title: "Your Business",
    description: "What does your business do?",
};

function buildSteps(isBusiness: boolean): StepConfig[] {
    if (!isBusiness) return BASE_STEPS;
    const steps = [...BASE_STEPS];
    // Insert business description step after timezone (index 3)
    steps.splice(4, 0, BUSINESS_STEP);
    return steps;
}

function getRecommendedTemplates(): AgentTemplateId[] {
    return ["maya", "jack"];
}

function getOtherTemplates(): AgentTemplateId[] {
    return ["lily", "max", "sarah", "emma", "chris", "kevin", "zoe"];
}

const DEPLOY_DURATION_MS = 10000;

export function SetupWizard() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [visitedIds, setVisitedIds] = useState<Set<StepId>>(new Set(["welcome"]));
    const [deployState, setDeployState] = useState<'idle' | 'loading' | 'success'>('idle');
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
            // Personalization
            usageType: undefined,
            userName: "",
            timezone: "",
            businessDescription: "",
            goals: [],
            customGoal: "",
            workflows: [],
            customWorkflow: "",
            tools: [],
            agentTemplateIds: [],
            // Setup
            aiProvider: "",
            aiModel: "",
            aiApiKey: "",
            selectedChannel: undefined,
            channelToken: "",
        },
    });

    const formValues = useWatch({ control: methods.control });
    const isBusiness = formValues.usageType === "business";
    const steps = useMemo(() => buildSteps(isBusiness), [isBusiness]);

    /**
     * Calculate the furthest reachable step index based on current steps array and visited IDs.
     * A step is reachable if all previous steps have been visited.
     */
    const maxVisitedIndex = useMemo(() => {
        let max = 0;
        for (let i = 0; i < steps.length; i++) {
            if (visitedIds.has(steps[i].id)) {
                max = i;
            } else {
                break;
            }
        }
        return max;
    }, [steps, visitedIds]);

    // Synchronous clamp — avoids a double-render from setState in an effect.
    const safeCurrentIndex = Math.min(currentStepIndex, steps.length - 1);
    const currentStep = steps[safeCurrentIndex];

    const recommendedTemplates = useMemo(() => getRecommendedTemplates(), []);
    const otherTemplates = useMemo(() => getOtherTemplates(), []);

    /**
     * Derived validity — the single source of truth that feeds into WizardShell.
     */
    const isCurrentStepValid = useMemo((): boolean => {
        switch (currentStep?.id) {
            case "welcome":
                return true;
            case "usage-type":
                return !!formValues.usageType;
            case "user-name":
                return (formValues.userName?.trim().length ?? 0) > 0;
            case "timezone":
                return (formValues.timezone?.trim().length ?? 0) > 0;
            case "business-use":
                return (formValues.businessDescription?.trim().length ?? 0) > 0;
            case "goals":
                return Boolean(formValues.goals && formValues.goals.length > 0 && !methods.formState.errors.customGoal);
            case "workflows":
                return Boolean(formValues.workflows && formValues.workflows.length > 0 && !methods.formState.errors.customWorkflow);
            case "tools":
                return true; // optional
            case "character":
                return Boolean(formValues.agentTemplateIds && formValues.agentTemplateIds.length > 0);
            case "ai-brain":
                return Boolean(formValues.aiProvider && formValues.aiModel && formValues.aiApiKey && formValues.aiApiKey.trim().length >= 5);
            case "channel-setup":
                return Boolean(formValues.selectedChannel && formValues.channelToken && formValues.channelToken.trim().length >= 5);
            case "deploy":
                return true;
            default:
                return false;
        }
    }, [currentStep, formValues, methods.formState.errors]);

    const goNext = () => {
        if (currentStepIndex < steps.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            
            // Track that we've reached the next step
            setVisitedIds((prev) => {
                const nextId = steps[nextIndex].id;
                if (prev.has(nextId)) return prev;
                const nextSet = new Set(prev);
                nextSet.add(nextId);
                return nextSet;
            });
        }
    };

    const goBack = () => {
        if (deployState !== 'idle') return;
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const handleStepClick = (index: number) => {
        if (deployState !== 'idle' || index === currentStepIndex) return;

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
        if (deployState !== 'idle' || !isCurrentStepValid) return;
        if (currentStepIndex === steps.length - 1) {
            setDeployState('loading');

            // Clear any existing timer just in case
            if (deployTimeoutRef.current) clearTimeout(deployTimeoutRef.current);

            deployTimeoutRef.current = setTimeout(() => {
                setDeployState('success');
            }, DEPLOY_DURATION_MS);
        } else {
            goNext();
        }
    };

    const handleReset = () => {
        methods.reset();
        setCurrentStepIndex(0);
        setVisitedIds(new Set(["welcome"]));
        setDeployState('idle');
        if (deployTimeoutRef.current) {
            clearTimeout(deployTimeoutRef.current);
        }
    };

    const renderStep = () => {
        const setValue = methods.setValue;
        switch (currentStep?.id) {
            case "welcome":
                return <WelcomeStep />;
            case "usage-type":
                return (
                    <UsageTypeStep
                        value={formValues.usageType}
                        onChange={(v) => setValue("usageType", v, { shouldValidate: true })}
                    />
                );
            case "user-name":
                return (
                    <UserNameStep
                        value={formValues.userName ?? ""}
                        onChange={(v) => setValue("userName", v, { shouldValidate: true })}
                    />
                );
            case "timezone":
                return (
                    <TimezoneStep
                        value={formValues.timezone ?? ""}
                        onChange={(v) => setValue("timezone", v, { shouldValidate: true })}
                    />
                );
            case "business-use":
                return (
                    <BusinessUseStep
                        value={formValues.businessDescription ?? ""}
                        onChange={(v) => setValue("businessDescription", v, { shouldValidate: true })}
                    />
                );
            case "goals":
                return (
                    <GoalsStep
                        value={formValues.goals ?? []}
                        onChange={(v) => setValue("goals", v, { shouldValidate: true })}
                        customGoal={formValues.customGoal ?? ""}
                        onCustomGoalChange={(v: string) => setValue("customGoal", v, { shouldValidate: true })}
                    />
                );
            case "workflows":
                return (
                    <WorkflowsStep
                        value={formValues.workflows ?? []}
                        onChange={(v) => setValue("workflows", v, { shouldValidate: true })}
                        customWorkflow={formValues.customWorkflow ?? ""}
                        onCustomWorkflowChange={(v: string) => setValue("customWorkflow", v, { shouldValidate: true })}
                    />
                );
            case "tools":
                return (
                    <ToolsStep
                        value={formValues.tools ?? []}
                        onChange={(v) => setValue("tools", v, { shouldValidate: true })}
                    />
                );
            case "character":
                return (
                    <CharacterSelectionView
                        selectedTemplateIds={(formValues.agentTemplateIds as AgentTemplateId[]) ?? []}
                        recommendedTemplates={recommendedTemplates}
                        otherTemplates={otherTemplates}
                        onSelect={(id) => {
                            const current = (formValues.agentTemplateIds as AgentTemplateId[]) ?? [];
                            const next = current.includes(id) ? current.filter(tId => tId !== id) : [...current, id];
                            setValue("agentTemplateIds", next, { shouldValidate: true });
                        }}
                    />
                );
            case "ai-brain":
                return <AIBrainStep />;
            case "channel-setup":
                return <ChannelSetupStep />;
            case "deploy":
                if (deployState === 'loading') return <DeployProgressView duration={DEPLOY_DURATION_MS} />;
                if (deployState === 'success') return <DeploySuccessView />;
                return (
                    <DeploymentStep
                        aiProvider={formValues.aiProvider ?? ""}
                        aiModel={formValues.aiModel ?? ""}
                        selectedChannel={formValues.selectedChannel ?? ""}
                        agentTemplateIds={(formValues.agentTemplateIds as AgentTemplateId[]) ?? []}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <FormProvider {...methods}>
            <WizardShell
                steps={steps}
                currentStepIndex={currentStepIndex}
                maxVisitedIndex={maxVisitedIndex}
                canProgress={isCurrentStepValid}
                deployState={deployState}
                onNext={handleNextClick}
                onBack={goBack}
                onStepClick={handleStepClick}
                onReset={handleReset}
                title="Setup Wizard"
            >
                {renderStep()}
            </WizardShell>
        </FormProvider>
    );
}
