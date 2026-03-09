"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WizardShell } from "@/components/ui/wizard/WizardShell";
import { onboardingSchema, type OnboardingFormValues, type AgentTemplateId } from "./schema";

// Step components
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
    | "usage-type"
    | "user-name"
    | "timezone"
    | "business-use"
    | "goals"
    | "workflows"
    | "tools"
    | "character";

interface StepConfig {
    id: StepId;
    title: string;
    description: string;
}

const BASE_STEPS: StepConfig[] = [
    { id: "usage-type", title: "Usage", description: "Business or personal?" },
    { id: "user-name", title: "Your Name", description: "How should we address you?" },
    { id: "timezone", title: "Timezone", description: "Where are you based?" },
    { id: "goals", title: "Goals", description: "What do you want to achieve?" },
    { id: "workflows", title: "Workflows", description: "What will your agent handle?" },
    { id: "tools", title: "Tools", description: "What's in your stack?" },
    { id: "character", title: "Character", description: "Meet your agent" },
];

const BUSINESS_STEP: StepConfig = {
    id: "business-use",
    title: "Your Business",
    description: "What does your business do?",
};

/** Builds the ordered step list, splicing in the business step when needed. */
function buildSteps(isBusiness: boolean): StepConfig[] {
    if (!isBusiness) return BASE_STEPS;
    const steps = [...BASE_STEPS];
    // Insert business description step after timezone (index 3)
    steps.splice(3, 0, BUSINESS_STEP);
    return steps;
}

/** Returns hardcoded available templates. */
function getAvailableTemplates(): AgentTemplateId[] {
    return ["maya", "jack", "emma", "lily", "max", "sarah"];
}

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

export function PersonalizationWizard() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);

    const methods = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        mode: "onChange",
        defaultValues: {
            usageType: undefined,
            userName: "",
            timezone: "",
            businessDescription: "",
            goals: [],
            customGoal: "",
            workflows: [],
            tools: [],
            agentTemplateId: undefined,
        },
    });

    const formValues = useWatch({ control: methods.control });
    const isBusiness = formValues.usageType === "business";
    const steps = useMemo(() => buildSteps(isBusiness), [isBusiness]);
    const currentStep = steps[currentStepIndex];

    const availableTemplates = useMemo(() => getAvailableTemplates(), []);

    const isCurrentStepValid = useMemo((): boolean => {
        switch (currentStep?.id) {
            case "usage-type":
                return !!formValues.usageType;
            case "user-name":
                return (formValues.userName?.trim().length ?? 0) > 0;
            case "timezone":
                return (formValues.timezone?.trim().length ?? 0) > 0;
            case "business-use":
                return (formValues.businessDescription?.trim().length ?? 0) > 0;
            case "goals":
                return (formValues.goals?.length ?? 0) > 0;
            case "workflows":
                return (formValues.workflows?.length ?? 0) > 0;
            case "tools":
                return true; // optional
            case "character":
                return !!formValues.agentTemplateId;
            default:
                return false;
        }
    }, [currentStep, formValues]);

    const goNext = () => {
        if (currentStepIndex < steps.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            setMaxVisitedIndex((prev) => Math.max(prev, nextIndex));
        } else {
            window.location.href = "/";
        }
    };

    const goBack = () => {
        if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1);
    };

    const handleStepClick = (index: number) => {
        if (index === currentStepIndex) return;
        if (index < currentStepIndex) {
            setCurrentStepIndex(index);
            return;
        }
        if (isCurrentStepValid && index <= maxVisitedIndex) {
            setCurrentStepIndex(index);
        }
    };

    const handleNextClick = () => {
        if (!isCurrentStepValid) return;
        goNext();
    };

    const renderStep = () => {
        const setValue = methods.setValue;
        switch (currentStep?.id) {
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
                        selectedTemplateId={formValues.agentTemplateId as AgentTemplateId | undefined}
                        availableTemplates={availableTemplates}
                        onSelect={(id) => setValue("agentTemplateId", id, { shouldValidate: true })}
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
                onNext={handleNextClick}
                onBack={goBack}
                onStepClick={handleStepClick}
                title="Get Started"
            >
                {renderStep()}
            </WizardShell>
        </FormProvider>
    );
}
