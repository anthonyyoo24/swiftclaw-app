"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onComplete: () => void;
}

const CHANNELS = [
    {
        id: "telegram",
        name: "Telegram",
        description: "Connect via BotFather",
        icon: "mdi:telegram",
        colorClass: "bg-[#229ED9]/10 text-[#229ED9]",
        tokenLabel: "Bot API Token",
    },
    {
        id: "discord",
        name: "Discord",
        description: "Developer Portal",
        icon: "mdi:discord",
        colorClass: "bg-[#5865F2]/10 text-[#5865F2]",
        tokenLabel: "Bot Token",
    },
    {
        id: "whatsapp",
        name: "WhatsApp",
        description: "Business API Setup",
        icon: "mdi:whatsapp",
        colorClass: "bg-[#25D366]/10 text-[#25D366]",
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
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Content Header */}
            <div className="mb-12">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Icon icon="solar:chat-round-line-linear" className="text-2xl text-neutral-300" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">Communication Channel</h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                    Select the platform where your SwiftClaw agent will interact
                    with users and provide the necessary credentials to connect.
                </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {CHANNELS.map((channel) => (
                        <label key={channel.id} className="cursor-pointer group relative">
                            <input
                                type="radio"
                                name="channel"
                                className="peer sr-only"
                                checked={selectedChannel === channel.id}
                                onChange={() => {
                                    setSelectedChannel(channel.id);
                                    setToken(""); // Reset token on change
                                }}
                            />
                            <div className="h-full border border-white/10 rounded-2xl p-5 bg-[#0a0a0c] hover:bg-white/5 peer-checked:border-blue-500/50 peer-checked:bg-blue-500/5 transition-all">
                                <div className="absolute top-4 right-4 w-4 h-4 rounded-full border border-white/20 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity">
                                    </div>
                                </div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${channel.colorClass}`}>
                                    <Icon icon={channel.icon} className="text-2xl" />
                                </div>
                                <h3 className="font-medium text-sm text-white mb-1">
                                    {channel.name}
                                </h3>
                                <p className="text-xs text-neutral-500">
                                    {channel.description}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>

                {selectedChannel && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 fade-in">
                        <label className="block text-sm font-medium text-neutral-300">
                            {CHANNELS.find((c) => c.id === selectedChannel)?.tokenLabel} / API Key
                            <span className="text-blue-500 pl-1">*</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-400 transition-colors">
                                <Icon icon="solar:key-linear" className="text-lg" />
                            </div>
                            <input
                                type="password"
                                placeholder="Enter your platform token..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/5 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-start gap-2.5 mt-3 px-1">
                            <Icon icon="solar:shield-check-linear" className="text-neutral-500 mt-0.5 shrink-0 text-lg" />
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                Your tokens are securely encrypted. SwiftClaw uses this to
                                authenticate with your selected platform.
                            </p>
                        </div>
                    </div>
                )}
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
                    disabled={!selectedChannel || !token}
                    className="disabled:opacity-50 disabled:cursor-not-allowed group inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ml-auto"
                >
                    Continue
                    <Icon icon="solar:arrow-right-linear" className="text-lg transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>
        </div>
    );
}

