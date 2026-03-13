"use client";

import { TextareaStep } from "@/components/onboarding/shared/TextareaStep";
import { useWizardField } from "../hooks/useWizardField";

export function GoalsStep() {
    const { value, onChange } = useWizardField("goals");

    return (
        <TextareaStep
            title="What are your goals?"
            description="What specific goals would you like your agent help you achieve?"
            icon="solar:target-linear"
            placeholder="e.g. I want to automate customer support and reduce my response times."
            value={value ?? ""}
            onChange={onChange}
        />
    );
}
