import { Icon } from "@iconify/react";
import { WelcomeIllustration } from "../WelcomeIllustration";

export function WelcomeStep() {
    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Content Header */}
            <div>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Icon icon="solar:hand-stars-linear" className="text-2xl text-neutral-300" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">
                    Welcome to SwiftClaw
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                    To get your agent up and running, we&apos;ll walk you through three essential setup stages. Once your agent is deployed, we&apos;ll move into a focused personalization wizard to fine-tune your specific preferences.
                </p>
            </div>

            <WelcomeIllustration />
        </div>
    );
}
