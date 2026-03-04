"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import { Anthropic, OpenAI, Google } from "@lobehub/icons";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onComplete: () => void;
}

const PROVIDER_OPTIONS: DropdownOption[] = [
    {
        id: "anthropic",
        label: "Anthropic",
        icon: <Anthropic size={20} className="w-5 h-5 text-[#D97757]" />
    },
    {
        id: "openai",
        label: "OpenAI",
        icon: <OpenAI size={20} className="w-5 h-5 text-[#10A37F]" />
    },
    {
        id: "google",
        label: "Google",
        icon: <Google size={20} className="w-5 h-5 text-[#4285F4]" />
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

export function AIBrainStep({ onNext, onBack }: StepProps) {
    const [provider, setProvider] = useState("anthropic");
    const [model, setModel] = useState("claude-3-5-sonnet");
    const [apiKey, setApiKey] = useState("");

    const handleNext = () => {
        // In a real app, save to context/store here
        onNext();
    };

    const handleProviderChange = (newProvider: string) => {
        setProvider(newProvider);
        if (MODEL_OPTIONS[newProvider] && MODEL_OPTIONS[newProvider].length > 0) {
            setModel(MODEL_OPTIONS[newProvider][0].id);
        }
    };

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Content Header */}
            <div className="mb-12">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Icon icon="solar:cpu-linear" className="text-2xl text-neutral-300" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">AI Brain Selection</h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                    This selection defines the core intelligence of your SwiftClaw agent. You can change your provider and model later in the settings.
                </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Provider Dropdown */}
                    <div className="space-y-3">
                        <CustomDropdown
                            label="LLM Provider"
                            options={PROVIDER_OPTIONS}
                            value={provider}
                            onChange={handleProviderChange}
                        />
                    </div>

                    {/* Model Dropdown */}
                    <div className="space-y-3">
                        <CustomDropdown
                            label="Model Version"
                            options={MODEL_OPTIONS[provider] || []}
                            value={model}
                            onChange={setModel}
                        />
                    </div>
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

            {/* Bottom Action */}
            <div className="mt-auto pt-12 border-t border-white/5 flex justify-between">
                <button
                    onClick={onBack}
                    className="text-sm font-medium text-neutral-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="group inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ml-auto cursor-pointer"
                >
                    Continue
                    <Icon icon="solar:arrow-right-linear" className="text-lg transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>
        </div>
    );
}
