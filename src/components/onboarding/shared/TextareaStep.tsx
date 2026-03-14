"use client";

import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import { Textarea } from "@/components/ui/Textarea";

export interface TextareaStepProps {
    title: string;
    description: string;
    icon: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
}

export function TextareaStep({
    title,
    description,
    icon,
    placeholder,
    value,
    onChange,
    rows = 7,
}: TextareaStepProps) {
    return (
        <div className="w-full max-w-lg mx-auto space-y-8 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                title={title}
                description={description}
                icon={icon}
            />

            <div className="space-y-3">
                <Textarea
                    aria-label={title}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                    autoFocus
                    rows={rows}
                    variant="glass"
                    className="resize-none leading-relaxed no-drag select-text relative z-50"
                />
            </div>
        </div>
    );
}
