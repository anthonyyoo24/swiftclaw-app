"use client";

import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import { Textarea } from "@/components/ui/Textarea";

interface BusinessUseStepProps {
    value: string;
    onChange: (value: string) => void;
}

export function BusinessUseStep({ value, onChange }: BusinessUseStepProps) {
    return (
        <div className="w-full max-w-lg mx-auto space-y-8 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                title="What does your business do?"
                description="A short description helps your agent understand your industry and context."
                icon="solar:shop-linear"
            />

            <div className="space-y-3">
                <Textarea
                    placeholder="e.g. We run an e-commerce store selling handmade jewellery to customers in North America."
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                    autoFocus
                    rows={7}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-white/40 focus:outline-none focus-visible:border-white/20 focus-visible:ring-transparent text-white placeholder:text-neutral-600 rounded-xl resize-none transition-colors text-sm leading-relaxed no-drag select-text relative z-50"
                />
            </div>
        </div>
    );
}
