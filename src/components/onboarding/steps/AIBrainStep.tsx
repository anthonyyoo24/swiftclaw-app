"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onComplete: () => void;
}

const PROVIDERS = [
    { id: "anthropic", label: "Anthropic" },
    { id: "openai", label: "OpenAI" },
    { id: "google", label: "Google" },
];

const MODELS: Record<string, { id: string; label: string }[]> = {
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

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        if (MODELS[newProvider] && MODELS[newProvider].length > 0) {
            setModel(MODELS[newProvider][0].id);
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
                        <label className="block text-sm font-medium text-neutral-300">
                            LLM Provider <span className="text-blue-500">*</span>
                        </label>
                        <div className="relative group">
                            <select
                                value={provider}
                                onChange={handleProviderChange}
                                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer shadow-sm appearance-none"
                            >
                                {PROVIDERS.map((p) => (
                                    <option key={p.id} value={p.id} className="bg-[#0a0a0c] text-white">
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500 group-hover:text-neutral-300 transition-colors">
                                <Icon icon="solar:alt-arrow-down-linear" className="text-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Model Dropdown */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-neutral-300">
                            Model Version <span className="text-blue-500">*</span>
                        </label>
                        <div className="relative group">
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer shadow-sm appearance-none"
                            >
                                {MODELS[provider]?.map((m) => (
                                    <option key={m.id} value={m.id} className="bg-[#0a0a0c] text-white">
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500 group-hover:text-neutral-300 transition-colors">
                                <Icon icon="solar:alt-arrow-down-linear" className="text-lg" />
                            </div>
                        </div>
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
                    className="text-sm font-medium text-neutral-400 hover:text-white transition-colors focus:outline-none"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="group inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ml-auto"
                >
                    Continue
                    <Icon icon="solar:arrow-right-linear" className="text-lg transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>
        </div>
    );
}

