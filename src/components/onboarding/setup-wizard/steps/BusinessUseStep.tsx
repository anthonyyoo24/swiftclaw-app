"use client";

import { TextareaStep } from "@/components/onboarding/shared/TextareaStep";

interface BusinessUseStepProps {
    value: string;
    onChange: (value: string) => void;
}

export function BusinessUseStep({ value, onChange }: BusinessUseStepProps) {
    return (
        <TextareaStep
            title="What does your business do?"
            description="A short description helps your agent understand your industry and context."
            icon="solar:shop-linear"
            placeholder="e.g. We run an e-commerce store selling handmade jewellery to customers in North America."
            value={value}
            onChange={onChange}
        />
    );
}
