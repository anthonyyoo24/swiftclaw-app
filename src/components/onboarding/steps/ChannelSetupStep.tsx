"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { ChannelOptionCard, ChannelOption } from "./ChannelOptionCard";

const CHANNELS: ChannelOption[] = [
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

interface StepProps {
    setIsValid?: (isValid: boolean) => void;
}

export function ChannelSetupStep({ setIsValid }: StepProps) {
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [token, setToken] = useState("");

    useEffect(() => {
        if (setIsValid) {
            setIsValid(!!(selectedChannel && token));
        }
    }, [selectedChannel, token, setIsValid]);

    const handleChannelSelect = (id: string) => {
        setSelectedChannel(id);
        setToken(""); // Reset token on change
    };

    const activeChannel = CHANNELS.find((c) => c.id === selectedChannel);

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                icon="solar:chat-round-line-linear"
                title="Communication Channel"
                description="Select the platform where your SwiftClaw agent will interact with users and provide the necessary credentials to connect."
            />

            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {CHANNELS.map((channel) => (
                        <ChannelOptionCard
                            key={channel.id}
                            channel={channel}
                            isSelected={selectedChannel === channel.id}
                            onSelect={handleChannelSelect}
                        />
                    ))}
                </div>

                {selectedChannel && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 fade-in">
                        <label className="block text-sm font-medium text-neutral-300">
                            {activeChannel?.tokenLabel}
                            <span className="text-blue-500 pl-1">*</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-400 transition-colors">
                                <Icon icon="solar:key-linear" className="text-lg" />
                            </div>
                            <input
                                type="text"
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
        </div>
    );
}
