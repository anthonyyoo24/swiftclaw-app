"use client";

import { useState } from "react";

import { Cpu, Key, Info, ArrowRight, ArrowLeft } from "lucide-react";
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
        // Reset model to first available for new provider
        if (MODEL_OPTIONS[newProvider]) {
            setModel(MODEL_OPTIONS[newProvider][0].id);
        }
    };

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Content Header */}
            <div className="mb-10">
                <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center mb-6">
                    <Cpu className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">AI Brain Selection</h1>
                <p className="text-base text-gray-500 leading-relaxed">
                    This selection defines the core intelligence of your SwiftClaw agent. You can change your provider and model later in the settings.
                </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Provider Dropdown */}
                    <div className="space-y-2.5">
                        <CustomDropdown
                            label="LLM Provider *"
                            options={PROVIDER_OPTIONS}
                            value={provider}
                            onChange={handleProviderChange}
                        />
                    </div>

                    {/* Model Dropdown */}
                    <div className="space-y-2.5">
                        <CustomDropdown
                            label="Model Version *"
                            options={MODEL_OPTIONS[provider] || []}
                            value={model}
                            onChange={setModel}
                        />
                    </div>
                </div>

                {/* API Key Input */}
                <div className="space-y-2.5">
                    <label className="block text-sm font-medium text-gray-900">
                        API Key <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-600 transition-colors">
                            <Key className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <input
                            type="password"
                            placeholder="sk-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-400 transition-all"
                        />
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                        <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                        <p className="text-sm text-gray-500">
                            Your API key is stored locally in your keychain and is never transmitted to SwiftClaw servers.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Action */}
            <div className="mt-auto pt-10 flex justify-between">
                <button
                    onClick={onBack}
                    className="text-gray-600 hover:text-gray-900 px-5 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all flex items-center gap-2 shadow-sm"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}
