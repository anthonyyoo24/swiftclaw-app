"use client";

import { Icon } from "@iconify/react";
import { Anthropic, OpenAI, Google } from "@lobehub/icons";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import { PROVIDER_OPTIONS, MODEL_OPTIONS } from "./AIBrainStep";
import { CHANNELS } from "./ChannelSetupStep";

interface DeploymentStepProps {
    aiProvider?: string;
    aiModel?: string;
    selectedChannel?: string | null;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
    anthropic: <Anthropic size={18} className="text-[#D97757]" />,
    openai: <OpenAI size={18} className="text-[#10A37F]" />,
    google: <Google size={18} className="text-[#4285F4]" />,
};

export function DeploymentStep({ aiProvider, aiModel, selectedChannel }: DeploymentStepProps) {
    const providerOption = aiProvider ? PROVIDER_OPTIONS.find((p) => p.id === aiProvider) : undefined;
    const modelOption = aiProvider ? MODEL_OPTIONS[aiProvider]?.find((m) => m.id === aiModel) : undefined;
    const channelOption = CHANNELS.find((c) => c.id === selectedChannel);

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                icon="solar:rocket-linear"
                title="Ready to Deploy"
                description="Your SwiftClaw agent is configured and ready. Review your settings below before initiating the deployment process."
            />

            {/* Configuration Summary */}
            <div className="space-y-6 flex-1">
                <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-white/5 bg-white/2">
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <Icon icon="solar:document-text-linear" className="text-neutral-400 text-lg" />
                            Configuration Summary
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* AI Brain Summary */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                                    {aiProvider && PROVIDER_ICONS[aiProvider] ? PROVIDER_ICONS[aiProvider] : (
                                        <Icon icon="solar:cpu-linear" className="text-neutral-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white mb-0.5">AI Brain</p>
                                    <p className="text-xs text-neutral-400">
                                        {providerOption?.label ?? aiProvider} — {modelOption?.label ?? aiModel}
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                Ready
                            </span>
                        </div>

                        <div className="h-px w-full bg-white/5" />

                        {/* Communication Channel Summary */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${channelOption ? channelOption.colorClass : "bg-white/5 text-neutral-400"
                                        }`}
                                >
                                    <Icon
                                        icon={channelOption?.icon ?? "solar:chat-round-line-linear"}
                                        className="text-base"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white mb-0.5">Communication Channel</p>
                                    <p className="text-xs text-neutral-400">
                                        {channelOption ? `${channelOption.name} — ${channelOption.description}` : "Not selected"}
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                Ready
                            </span>
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <Icon icon="solar:info-circle-linear" className="text-blue-400 text-lg shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200/70 leading-relaxed">
                        Deployment typically takes 1-2 minutes. We will provision your secure environment and
                        establish encrypted connections to your chosen services.
                    </p>
                </div>
            </div>
        </div>
    );
}
