"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import { Anthropic, OpenAI, Google } from "@lobehub/icons";
import { StepHeader } from "@/components/onboarding/StepHeader";

const PROVIDER_OPTIONS: DropdownOption[] = [
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

const MODEL_OPTIONS: Record<string, DropdownOption[]> = {
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

interface StepProps {
    setIsValid?: (isValid: boolean) => void;
}

export function AIBrainStep(_props: StepProps) {
    const [provider, setProvider] = useState("anthropic");
    const [model, setModel] = useState("claude-3-5-sonnet");
    const [apiKey, setApiKey] = useState("");

    const handleProviderChange = (newProvider: string) => {
        setProvider(newProvider);
        if (MODEL_OPTIONS[newProvider]?.length > 0) {
            setModel(MODEL_OPTIONS[newProvider][0].id);
        }
    };

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                icon="solar:cpu-linear"
                title="AI Brain Selection"
                description="This selection defines the core intelligence of your SwiftClaw agent. You can change your provider and model later in the settings."
            />

            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomDropdown
                        label="LLM Provider"
                        options={PROVIDER_OPTIONS}
                        value={provider}
                        onChange={handleProviderChange}
                    />
                    <CustomDropdown
                        label="Model Version"
                        options={MODEL_OPTIONS[provider] || []}
                        value={model}
                        onChange={setModel}
                    />
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
                        <input
                            type="password"
                            placeholder="sk-ant-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/5 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm"
                        />
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
