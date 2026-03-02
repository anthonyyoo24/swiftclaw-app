"use client";

import { useState } from "react";
import { Cpu, ChevronDown, Key, Info, ArrowRight, ArrowLeft } from "lucide-react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onComplete: () => void;
}

export function AIBrainStep({ onNext, onBack }: StepProps) {
    const [provider, setProvider] = useState("anthropic");
    const [model, setModel] = useState("claude-3-5-sonnet");
    const [apiKey, setApiKey] = useState("");

    const handleNext = () => {
        // In a real app, save to context/store here
        onNext();
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
                        <label className="block text-sm font-medium text-gray-900">
                            LLM Provider <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-400 transition-all cursor-pointer"
                            >
                                <option value="anthropic">Anthropic</option>
                                <option value="openai">OpenAI</option>
                                <option value="google">Google</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Model Dropdown */}
                    <div className="space-y-2.5">
                        <label className="block text-sm font-medium text-gray-900">
                            Model Version <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-400 transition-all cursor-pointer"
                            >
                                {provider === "anthropic" && (
                                    <>
                                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                                        <option value="claude-3-opus">Claude 3 Opus</option>
                                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                                    </>
                                )}
                                {provider === "openai" && (
                                    <>
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                    </>
                                )}
                                {provider === "google" && (
                                    <>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                    </>
                                )}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                        </div>
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
