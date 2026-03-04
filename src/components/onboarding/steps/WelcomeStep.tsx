import { Icon } from "@iconify/react";

interface StepProps {
    setIsValid?: (isValid: boolean) => void;
}

export function WelcomeStep(_props: StepProps) {
    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Content Header */}
            <div className="mb-12">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Icon icon="solar:hand-stars-linear" className="text-2xl text-neutral-300" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">
                    Welcome to SwiftClaw
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                    We&apos;re excited to have you on board. SwiftClaw provides you with
                    advanced AI agent capabilities to automate, communicate, and
                    scale your operations effortlessly. Click continue to begin
                    configuring your first agent.
                </p>
            </div>


        </div>
    );
}
