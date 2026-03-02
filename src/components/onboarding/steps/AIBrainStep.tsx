"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Zap } from "lucide-react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

const MODELS = [
    {
        id: "sonnet-4.6",
        name: "Claude Sonnet 4.6",
        provider: "Anthropic",
        icon: Sparkles,
    },
    {
        id: "gpt-5.2",
        name: "GPT 5.2",
        provider: "OpenAI",
        icon: Bot,
    },
    {
        id: "gemini-3-flash",
        name: "Gemini 3 Flash",
        provider: "Google",
        icon: Zap,
    },
];

export function AIBrainStep({ onNext, onBack }: StepProps) {
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    const handleNext = () => {
        if (selectedModel) {
            // In a real app, save to context/store here
            onNext();
        }
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Select AI Brain</h2>
                <p className="text-muted-foreground">
                    Choose the primary intelligence engine for your digital twin.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                {MODELS.map((model) => {
                    const Icon = model.icon;
                    const isSelected = selectedModel === model.id;

                    return (
                        <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`flex items-center p-4 rounded-xl border-2 transition-all ${isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
                                }`}
                        >
                            <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 shrink-0 transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                <Icon size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-lg leading-none mb-1">{model.name}</h3>
                                <p className="text-sm text-muted-foreground">{model.provider}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-between mt-auto">
                <Button variant="ghost" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={handleNext} disabled={!selectedModel}>
                    Continue
                </Button>
            </div>
        </div>
    );
}
