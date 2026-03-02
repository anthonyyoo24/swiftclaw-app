"use client";

import { useState } from "react";
import { MessageSquare, PhoneCall, Send, Key, Info, ArrowRight, ArrowLeft } from "lucide-react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onComplete: () => void;
}

const CHANNELS = [
    {
        id: "discord",
        name: "Discord",
        icon: MessageSquare,
        tokenLabel: "Bot Token",
    },
    {
        id: "telegram",
        name: "Telegram",
        icon: Send,
        tokenLabel: "Bot API Token",
    },
    {
        id: "whatsapp",
        name: "WhatsApp",
        icon: PhoneCall,
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
            <div className="mb-10">
                <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center mb-6">
                    <MessageSquare className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Communication Channel</h1>
                <p className="text-base text-gray-500 leading-relaxed">
                    Select the platform you want to use to communicate with your SwiftClaw agent.
                </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${isSelected
                                    ? "border-gray-900 bg-gray-50 shadow-sm"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                                    }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 shrink-0 transition-colors ${isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    <Icon size={24} strokeWidth={1.5} />
                                </div>
                                <span className="font-medium text-base text-gray-900">{channel.name}</span>
                            </button>
                        );
                    })}
                </div>

                {selectedChannel && (
                    <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-300 fade-in">
                        <label className="block text-sm font-medium text-gray-900">
                            {CHANNELS.find((c) => c.id === selectedChannel)?.tokenLabel} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-600 transition-colors">
                                <Key className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                            <input
                                type="password"
                                placeholder="Enter your token..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-400 transition-all"
                            />
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                            <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                            <p className="text-sm text-gray-500">
                                This token allows SwiftClaw to connect to {CHANNELS.find((c) => c.id === selectedChannel)?.name}.
                            </p>
                        </div>
                    </div>
                )}
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
                    disabled={!selectedChannel || !token}
                    className="disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all flex items-center gap-2 shadow-sm"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}
