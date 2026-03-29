"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { WizardShell } from "@/components/ui/wizard/WizardShell";
import { toast } from "sonner";

import { STEP_SCHEMAS, onboardingSchema, type OnboardingFormValues, type AgentTemplateId, type StepId } from "./schema";

// Setup Steps
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIBrainStep } from "./steps/AIBrainStep";
import { ChannelSetupStep } from "./steps/ChannelSetupStep";
import { DeploymentStep } from "./steps/DeploymentStep";
import { DeployProgressView } from "./steps/DeployProgressView";
import { DeploySuccessView } from "./steps/DeploySuccessView";
import { DeployErrorView } from "./steps/DeployErrorView";

// Personalization Steps
import { UsageTypeStep } from "./steps/UsageTypeStep";
import { UserNameStep } from "./steps/UserNameStep";
import { TimezoneStep } from "./steps/TimezoneStep";
import { BusinessUseStep } from "./steps/BusinessUseStep";
import { PersonalContextStep } from "./steps/PersonalContextStep";
import { GoalsStep } from "./steps/GoalsStep";
import { WorkflowsStep } from "./steps/WorkflowsStep";
import { ToolsStep } from "./steps/ToolsStep";
import { CharacterSelectionView } from "./steps/CharacterSelectionView";
import { dispatchOnboardingStatusChanged } from "@/hooks/useOnboardingStatus";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------



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

const PERSONAL_STEP: StepConfig = {
    id: "personal-context",
    title: "About You",
    description: "Tell us a bit about yourself",
};

function buildSteps(isBusiness: boolean): StepConfig[] {
    const steps = [...BASE_STEPS];
    // Insert business or personal description step after timezone (index 3)
    if (isBusiness) {
        steps.splice(4, 0, BUSINESS_STEP);
    } else {
        steps.splice(4, 0, PERSONAL_STEP);
    }
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
    const [deployState, setDeployState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [deployError, setDeployError] = useState<string>("");
    const deployTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const backendSuccessRef = useRef(false);
    const timerFinishedRef = useRef(false);

    const methods = useForm<OnboardingFormValues>({
        mode: "onChange",
        defaultValues: {
            // Personalization
            usageType: undefined,
            userName: "",
            timezone: "",
            businessDescription: "",
            personalContext: "",
            goals: "",
            workflows: [],
            tools: [],
            agentTemplateIds: ["sarah"],
            // Setup
            aiAuthType: "apiKey",
            isAiAuthenticated: false,
            aiProvider: "",
            aiModel: "",
            aiApiKey: "",
            selectedChannel: undefined,
            channelToken: "",
        },
    });

    // Manage deployment process IPC listeners
    useEffect(() => {
        if (deployState !== 'loading') {
            return () => {
                if (deployTimeoutRef.current) {
                    clearTimeout(deployTimeoutRef.current);
                    deployTimeoutRef.current = null;
                }
            };
        }

        let cleanupIpc: (() => void) | undefined;

        const checkComplete = () => {
            if (timerFinishedRef.current && backendSuccessRef.current) {
                setDeployState('success');
            }
        };

        // 1. Force the 10 second minimum UI experience
        timerFinishedRef.current = false;
        deployTimeoutRef.current = setTimeout(() => {
            timerFinishedRef.current = true;
            checkComplete();
        }, DEPLOY_DURATION_MS);

        // 2. Connect to backend
        if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
            backendSuccessRef.current = false;
            
            cleanupIpc = window.electron.ipcRenderer.onDeploymentSuccess(() => {
                backendSuccessRef.current = true;
                checkComplete();
            });

            const errorCleanup = window.electron.ipcRenderer.onDeploymentError((data: unknown) => {
                const typedData = data as { message?: string };
                if (deployTimeoutRef.current) clearTimeout(deployTimeoutRef.current);
                setDeployError(typedData?.message || "An unknown error occurred during deployment.");
                setDeployState('error');
            });

            // Start the deployment logic
            const currentValues = methods.getValues();
            const result = onboardingSchema.safeParse(currentValues);

            if (!result.success) {
                // [UNREACHABLE] — handleStartDeployment validates before setDeployState('loading').
                // Retained as a diagnostic safety net for future refactors.
                console.error("[UNREACHABLE] Schema parse failed inside deploy effect.", result.error);
                return;
            }

            // Happy path: valid data — proceed to IPC
            window.electron.ipcRenderer.sendDeploymentStart(result.data);

            const originalCleanup = cleanupIpc;
            cleanupIpc = () => {
                if (originalCleanup) originalCleanup();
                if (errorCleanup) errorCleanup();
            }
        } else {
            // Web mode fallback
            backendSuccessRef.current = true;
        }

        return () => {
            if (deployTimeoutRef.current) clearTimeout(deployTimeoutRef.current);
            if (cleanupIpc) cleanupIpc();
        };
    }, [deployState, methods]);

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
     * Derived validity — driven entirely by the step's own Zod schema via safeParse.
     */
    const isCurrentStepValid = useMemo((): boolean => {
        if (!currentStep) return false;
        const stepSchema = STEP_SCHEMAS[currentStep.id];
        return stepSchema.safeParse(formValues).success;
    }, [currentStep, formValues]);

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

    const handleStartDeployment = useCallback(() => {
        const result = onboardingSchema.safeParse(methods.getValues());

        if (!result.success) {
            const firstError = result.error.issues[0];
            const friendlyMessage = firstError
                ? `Please go back and check: ${firstError.message}`
                : "Please go back and ensure all required fields are filled out.";
            toast.error("Incomplete Setup", { description: friendlyMessage });
            console.error("Form validation failed before deploy:", result.error);
            return;
        }

        setDeployState('loading');
    }, [methods]);

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
            handleStartDeployment();
        } else {
            goNext();
        }
    };

    const handleReset = () => {
        // Clear onboarding cookie
        const isSecure = typeof window !== "undefined" && window.isSecureContext;
        document.cookie = `onboardingComplete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax${isSecure ? "; Secure" : ""}`;
        dispatchOnboardingStatusChanged();

        methods.reset();
        setCurrentStepIndex(0);
        setVisitedIds(new Set(["welcome"]));
        setDeployState('idle');
        if (deployTimeoutRef.current) {
            clearTimeout(deployTimeoutRef.current);
            deployTimeoutRef.current = null;
        }
    };

    const renderStep = () => {
        switch (currentStep?.id) {
            case "welcome":
                return <WelcomeStep />;
            case "usage-type":
                return <UsageTypeStep />;
            case "user-name":
                return <UserNameStep />;
            case "timezone":
                return <TimezoneStep />;
            case "business-use":
                return <BusinessUseStep />;
            case "personal-context":
                return <PersonalContextStep />;
            case "goals":
                return <GoalsStep />;
            case "workflows":
                return <WorkflowsStep />;
            case "tools":
                return <ToolsStep />;
            case "character":
                return (
                    <CharacterSelectionView
                        recommendedTemplates={recommendedTemplates}
                        otherTemplates={otherTemplates}
                    />
                );
            case "ai-brain":
                return <AIBrainStep />;
            case "channel-setup":
                return <ChannelSetupStep />;
            case "deploy":
                if (deployState === 'loading') return <DeployProgressView duration={DEPLOY_DURATION_MS} />;
                if (deployState === 'success') return <DeploySuccessView />;
                if (deployState === 'error') return <DeployErrorView error={deployError} onRetry={handleStartDeployment} />;
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
