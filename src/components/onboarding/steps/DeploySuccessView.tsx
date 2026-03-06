"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export function DeploySuccessView() {
    const router = useRouter();

    return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 min-h-100">
            {/* Animated Success Checkmark */}
            <div className="relative w-28 h-28 mb-8">
                {/* Glowing background */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />

                {/* Checkmark container */}
                <div className="relative w-full h-full rounded-full border-2 border-emerald-500 flex items-center justify-center">
                    <svg
                        className="w-12 h-12 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5 13L9 17L19 7"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="scale-0 opacity-0 animate-[spring-pop_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_0.2s_forwards]"
                            style={{
                                strokeDasharray: 24,
                                strokeDashoffset: 24,
                                animation: "draw-check 0.6s ease-out 0.2s forwards, fade-in 0.2s ease-out 0.2s forwards"
                            }}
                        />
                    </svg>
                </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">
                Agent Deployed Successfully
            </h2>

            <p className="text-neutral-400 text-center max-w-sm mb-12">
                Your SwiftClaw agent is live and securely connected to your selected services.
                Let's move on and teach it how to behave.
            </p>

            <button
                type="button"
                onClick={() => router.push('/onboarding/personalize')}
                className="group relative inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-full text-base font-medium shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] focus:outline-none focus-visible:ring-2 focus:ring-emerald-500/50 active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
            >
                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-3">
                    Personalize My Agent
                    <Icon icon="solar:arrow-right-linear" className="text-xl transition-transform group-hover:translate-x-1" />
                </span>
            </button>
            <style jsx>{`
                @keyframes draw-check {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
                @keyframes fade-in {
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
