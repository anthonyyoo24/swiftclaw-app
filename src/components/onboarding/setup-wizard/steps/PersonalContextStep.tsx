"use client";

import { TextareaStep } from "@/components/onboarding/shared/TextareaStep";
import { useWizardField } from "../hooks/useWizardField";

export function PersonalContextStep() {
    const { value, onChange } = useWizardField("personalContext");

    return (
        <TextareaStep
            title="Tell us about yourself"
            description="Help your agent understand your interests, lifestyle, work, and what you care about."
            icon="solar:user-circle-linear"
            placeholder="e.g. I'm a grad student and freelance writer. I'm interested in productivity, health, and staying on top of my reading list."
            value={value ?? ""}
            onChange={onChange}
        />
    );
}
