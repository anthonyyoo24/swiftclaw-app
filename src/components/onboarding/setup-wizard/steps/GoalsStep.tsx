"use client";

import { TextareaStep } from "@/components/onboarding/shared/TextareaStep";

interface GoalsStepProps {
    value: string;
    onChange: (value: string) => void;
}

export function GoalsStep({ value, onChange }: GoalsStepProps) {
    return (
        <TextareaStep
            title="What are your goals?"
            description="What specific goals would you like your agent help you achieve?"
            icon="solar:target-linear"
            placeholder="e.g. I want to automate customer support and reduce my response times."
            value={value}
            onChange={onChange}
        />
    );
}
