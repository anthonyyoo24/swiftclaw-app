"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/Input";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import { Anthropic, OpenAI, Google } from "@lobehub/icons";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import type { OnboardingFormValues } from "@/components/onboarding/setup-wizard/schema";

export const PROVIDER_OPTIONS: DropdownOption[] = [
    {
        id: "anthropic",
        label: "Anthropic",
        icon: <Anthropic size={20} className="w-5 h-5 text-[#D97757]" />,
    },
    {
        id: "openai",
        label: "OpenAI",
        icon: <OpenAI size={20} className="w-5 h-5 text-[#10A37F]" />,
    },
    {
        id: "google",
        label: "Google",
        icon: <Google size={20} className="w-5 h-5 text-[#4285F4]" />,
    },
];

export const MODEL_OPTIONS: Record<string, DropdownOption[]> = {
    anthropic: [
        { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
        { id: "claude-3-opus", label: "Claude 3 Opus" },
        { id: "claude-3-haiku", label: "Claude 3 Haiku" },
    ],
    openai: [
        { id: "gpt-4o", label: "GPT-4o" },
        { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
    ],
    google: [
        { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
        { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
};

export function AIBrainStep() {
    const { control, setValue, watch } = useFormContext<OnboardingFormValues>();
    const [showApiKey, setShowApiKey] = useState(false);

    const provider = watch("aiProvider");

    const handleProviderChange = (newProvider: string) => {
        setValue("aiProvider", newProvider, { shouldValidate: true });
        // Reset model when provider changes since models are provider-specific
        setValue("aiModel", "", { shouldValidate: true });
    };

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                // icon="solar:cpu-linear"
                icon="lucide:brain"
                title="AI Brain Selection"
                description="This selection defines the core intelligence of your SwiftClaw agent. You can change your provider and model later in the settings."
            />

            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Controller
                        name="aiProvider"
                        control={control}
                        render={({ field }) => (
                            <CustomDropdown
                                label="LLM Provider"
                                options={PROVIDER_OPTIONS}
                                value={field.value ?? ""}
                                onChange={handleProviderChange}
                                placeholder="Select provider..."
                            />
                        )}
                    />
                    {provider && (
                        <Controller
                            name="aiModel"
                            control={control}
                            render={({ field }) => (
                                <CustomDropdown
                                    label="Model Version"
                                    options={MODEL_OPTIONS[provider] || []}
                                    value={field.value ?? ""}
                                    onChange={(v) => field.onChange(v)}
                                    placeholder="Select model..."
                                />
                            )}
                        />
                    )}
                </div>

                {/* API Key Input */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-neutral-300">
                        API Key <span className="text-blue-500">*</span>
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-400 transition-colors">
                            <Icon icon="solar:key-linear" className="text-lg" />
                        </div>
                        <Controller
                            name="aiApiKey"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type={showApiKey ? "text" : "password"}
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="sk-ant-..."
                                    variant="glass"
                                    className="pl-11 pr-12 py-3 shadow-sm"
                                />
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-neutral-500 hover:text-neutral-300 transition-colors"
                            aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
                        >
                            <Icon icon={showApiKey ? "solar:eye-closed-linear" : "solar:eye-linear"} className="text-lg" />
                        </button>
                    </div>
                    <div className="flex items-start gap-2.5 mt-3 px-1">
                        <Icon icon="solar:info-circle-linear" className="text-neutral-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            Your API key is stored locally in your keychain and is never transmitted to SwiftClaw servers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
