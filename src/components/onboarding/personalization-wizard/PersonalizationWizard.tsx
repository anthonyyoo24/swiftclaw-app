"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WizardShell } from "@/components/ui/wizard/WizardShell";
import { personalizationSchema, type PersonalizationFormValues } from "./schema";
import { CharacterSelectionView } from "./steps/CharacterSelectionView";
import { AgentNameView } from "./steps/AgentNameView";
import { AgentNatureView } from "./steps/AgentNatureView";
import { AgentVibeView } from "./steps/AgentVibeView";
import { AgentEmojiView } from "./steps/AgentEmojiView";
import { CoreTruthsView } from "./steps/CoreTruthsView";
import { BoundariesView } from "./steps/BoundariesView";

const STEPS = [
    { title: "Character Selection", description: "Choose a template or go custom" },
    { title: "Agent Name", description: "What to call it" },
    { title: "Agent Nature", description: "Its self-concept" },
    { title: "Agent Vibe", description: "Its tone of voice" },
    { title: "Agent Emoji", description: "Its signature" },
    { title: "Core Truths", description: "Its absolute facts" },
    { title: "Boundaries", description: "What it must never do" },
];

export function PersonalizationWizard() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);

    const methods = useForm<PersonalizationFormValues>({
        resolver: zodResolver(personalizationSchema),
        mode: "onChange",
        defaultValues: {
            agentTemplateId: "custom",
            agentName: "",
            agentNature: "",
            agentVibe: "",
            agentEmoji: "🦞",
            coreTruths: [""],
            boundaries: [""],
        },
    });

    const formValues = useWatch({
        control: methods.control,
    });

    const isCustomMode = formValues.agentTemplateId === "custom";

    const isCurrentStepValid = useMemo((): boolean => {
        switch (currentStepIndex) {
            case 0: // Character Selection - always valid (defaults to custom)
                return !!formValues.agentTemplateId;
            case 1: // Name
                return !!formValues.agentName && formValues.agentName.trim().length > 0;
            case 2: // Nature
                return !!formValues.agentNature && formValues.agentNature.trim().length > 0;
            case 3: // Vibe
                return !!formValues.agentVibe && formValues.agentVibe.trim().length > 0;
            case 4: // Emoji
                return !!formValues.agentEmoji && formValues.agentEmoji.trim().length > 0;
            case 5: // Core Truths
                return !!formValues.coreTruths && formValues.coreTruths.filter((t: string) => t.trim().length > 0).length > 0;
            case 6: // Boundaries
                return !!formValues.boundaries && formValues.boundaries.filter((b: string) => b.trim().length > 0).length > 0;
            default:
                return false;
        }
    }, [currentStepIndex, formValues]);

    const goNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            let nextIndex = currentStepIndex + 1;

            // Skip logic: if we are on Step 1 (index 0) and picked a preset, jump to Step 6 (index 5)
            if (currentStepIndex === 0 && !isCustomMode) {
                nextIndex = 5;
            }

            setCurrentStepIndex(nextIndex);
            setMaxVisitedIndex((prev) => Math.max(prev, nextIndex));
        } else {
            // Finished personalization - redirect to dashboard
            window.location.href = "/";
        }
    };

    const goBack = () => {
        if (currentStepIndex > 0) {
            let prevIndex = currentStepIndex - 1;

            // Skip logic reverse: if we are on Step 6 (index 5) and picked a preset, jump back to Step 1 (index 0)
            if (currentStepIndex === 5 && !isCustomMode) {
                prevIndex = 0;
            }

            setCurrentStepIndex(prevIndex);
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

    const handleNextClick = () => {
        if (!isCurrentStepValid) return;
        goNext();
    };

    const renderStep = () => {
        switch (currentStepIndex) {
            case 0:
                return (
                    <CharacterSelectionView
                        selectedTemplateId={formValues.agentTemplateId as import("./schema").AgentTemplateId}
                        onSelect={(id) => {
                            methods.setValue("agentTemplateId", id, { shouldValidate: true });
                            if (id !== "custom") {
                                // Provide dummy data to bypass validation for skipped steps,
                                // or parse the template details here.
                                methods.setValue("agentName", "Template Default");
                                methods.setValue("agentNature", "Template");
                                methods.setValue("agentVibe", "Template");
                            } else {
                                methods.setValue("agentName", "");
                                methods.setValue("agentNature", "");
                                methods.setValue("agentVibe", "");
                            }
                        }}
                    />
                );
            case 1:
                return (
                    <AgentNameView
                        name={formValues.agentName || ""}
                        onChange={(val) => methods.setValue("agentName", val, { shouldValidate: true })}
                    />
                );
            case 2:
                return (
                    <AgentNatureView
                        nature={formValues.agentNature || ""}
                        onChange={(val) => methods.setValue("agentNature", val, { shouldValidate: true })}
                    />
                );
            case 3:
                return (
                    <AgentVibeView
                        vibe={formValues.agentVibe || ""}
                        onChange={(val) => methods.setValue("agentVibe", val, { shouldValidate: true })}
                    />
                );
            case 4:
                return (
                    <AgentEmojiView
                        emoji={formValues.agentEmoji || "🦞"}
                        onChange={(val) => methods.setValue("agentEmoji", val, { shouldValidate: true })}
                    />
                );
            case 5:
                return (
                    <CoreTruthsView
                        truths={formValues.coreTruths || [""]}
                        onChange={(val) => methods.setValue("coreTruths", val, { shouldValidate: true })}
                    />
                );
            case 6:
                return (
                    <BoundariesView
                        boundaries={formValues.boundaries || [""]}
                        onChange={(val) => methods.setValue("boundaries", val, { shouldValidate: true })}
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
                onNext={handleNextClick}
                onBack={goBack}
                onStepClick={handleStepClick}
                title="Personalization Wizard"
            >
                {renderStep()}
            </WizardShell>
        </FormProvider>
    );
}
