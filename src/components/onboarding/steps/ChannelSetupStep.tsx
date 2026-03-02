"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, PhoneCall, Send } from "lucide-react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

const CHANNELS = [
    {
        id: "discord",
        name: "Discord",
        icon: MessageSquare, // Using MessageSquare as generic chat for Discord
        tokenLabel: "Bot Token",
    },
    {
        id: "telegram",
        name: "Telegram",
        icon: Send, // Using Send for Telegram
        tokenLabel: "Bot API Token",
    },
    {
        id: "whatsapp",
        name: "WhatsApp",
        icon: PhoneCall, // Using PhoneCall for WhatsApp
        tokenLabel: "API Key",
    },
];

export function ChannelSetupStep({ onNext, onBack }: StepProps) {
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [token, setToken] = useState("");

    const handleNext = () => {
        if (selectedChannel && token) {
            // In a real app, save to context/store here
            onNext();
        }
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Communication Channel</h2>
                <p className="text-muted-foreground">
                    How will you talk to your digital twin?
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    const isSelected = selectedChannel === channel.id;

                    return (
                        <button
                            key={channel.id}
                            onClick={() => {
                                setSelectedChannel(channel.id);
                                setToken(""); // Reset token on change
                            }}
                            className={`flex items-center text-left p-4 rounded-xl border-2 transition-all ${isSelected
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
                                <span className="font-semibold text-sm">{channel.name}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedChannel && (
                <div className="space-y-4 mb-8 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                        <label htmlFor="token" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {CHANNELS.find((c) => c.id === selectedChannel)?.tokenLabel}
                        </label>
                        <Input
                            id="token"
                            type="password"
                            placeholder="Enter your token..."
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-auto pt-4">
                <Button variant="ghost" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={handleNext} disabled={!selectedChannel || !token}>
                    Continue
                </Button>
            </div>
        </div>
    );
}
