"use client";

import { TextareaStep } from "@/components/onboarding/shared/TextareaStep";
import { useWizardField } from "../hooks/useWizardField";

export function BusinessUseStep() {
    const { value, onChange } = useWizardField("businessDescription");

    return (
        <TextareaStep
            title="What does your business do?"
            description="A short description helps your agent understand your industry and context."
            icon="solar:shop-linear"
            placeholder="e.g. We run an e-commerce store selling handmade jewellery to customers in North America."
            value={value ?? ""}
            onChange={onChange}
        />
    );
}
