"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onComplete: () => void;
}

export function GatewayConnectionStep({ onBack, onComplete }: StepProps) {
    const [isDeploying, setIsDeploying] = useState(false);

    const handleDeploy = () => {
        setIsDeploying(true);
        // Simulate deployment delay
        setTimeout(() => {
            onComplete();
        }, 2000);
    };

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Content Header */}
            <div className="mb-12">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Icon icon="solar:rocket-linear" className="text-2xl text-neutral-300" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">
                    Ready to Deploy
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                    Your SwiftClaw agent is configured and ready. Review your settings below before initiating
                    the deployment process.
                </p>
            </div>

            {/* Configuration Summary */}
            <div className="space-y-6 flex-1">
                <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
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
                                    <Icon icon="solar:cpu-linear" className="text-neutral-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white mb-0.5">AI Brain</p>
                                    <p className="text-xs text-neutral-400">Anthropic Claude 3.5 Sonnet</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                Ready
                            </span>
                        </div>

                        <div className="h-px w-full bg-white/5"></div>

                        {/* Communication Channel Summary */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#229ED9]/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon icon="mdi:telegram" className="text-[#229ED9] text-base" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white mb-0.5">Communication Channel</p>
                                    <p className="text-xs text-neutral-400">Telegram Bot Integration</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
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

            {/* Bottom Action */}
            <div className="mt-auto pt-12 border-t border-white/5 flex justify-between items-center">
                <button
                    onClick={onBack}
                    disabled={isDeploying}
                    className="group px-6 py-2.5 rounded-full text-sm font-medium border border-white/10 text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                    <Icon icon="solar:arrow-left-linear" className="text-lg transition-transform group-hover:-translate-x-0.5" />
                    Back
                </button>
                <button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="group relative inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-3.5 rounded-full text-sm font-medium hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all overflow-hidden disabled:opacity-80 disabled:cursor-wait cursor-pointer"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center gap-2">
                        {isDeploying ? "Deploying..." : "Deploy Agent"}
                        {!isDeploying && (
                            <Icon icon="solar:rocket-linear" className="text-lg transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        )}
                        {isDeploying && (
                            <Icon icon="solar:refresh-linear" className="text-lg animate-spin" />
                        )}
                    </span>
                </button>
            </div>
        </div>
    );
}
