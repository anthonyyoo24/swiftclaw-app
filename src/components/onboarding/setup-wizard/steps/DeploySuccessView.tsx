"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { dispatchOnboardingStatusChanged } from "@/hooks/useOnboardingStatus";

export function DeploySuccessView() {
    const router = useRouter();
    const [secondsLeft, setSecondsLeft] = useState(5);

    /** Mark onboarding as complete and navigate to dashboard */
    const navigateToDashboard = () => {
        const isSecure = typeof window !== "undefined" && window.isSecureContext;
        const cookieSuffix = `; path=/; max-age=31536000; SameSite=Lax${isSecure ? "; Secure" : ""}`;
        document.cookie = `onboardingComplete=true${cookieSuffix}`;
        dispatchOnboardingStatusChanged();
        router.push("/");
    };

    useEffect(() => {
        // Countdown timer for auto-navigation
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (secondsLeft === 0) {
            navigateToDashboard();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secondsLeft]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 min-h-100">
            {/* Animated Success Checkmark */}
            <div className="relative w-28 h-28 mb-8">
                {/* Glowing background */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />

                {/* Checkmark container */}
                <div className="relative w-full h-full rounded-full border-2 border-emerald-500/50 flex items-center justify-center">
                    <svg
                        className="w-28 h-28 text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] opacity-0 scale-50"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            animation: "pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                        }}
                    >
                        <path
                            d="M2.5 12.5L9.5 19.5L21.5 5.5"
                            stroke="currentColor"
                            strokeWidth="4.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength="100"
                            style={{
                                strokeDasharray: 100,
                                strokeDashoffset: 100,
                                animation: "draw-check 0.6s ease-out 0.3s forwards"
                            }}
                        />
                    </svg>
                </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">
                Agent Deployed Successfully
            </h2>

            <p className="text-neutral-400 text-center max-w-sm mb-8">
                Your SwiftClaw agent is live and securely connected to your selected services.
                Redirecting to your dashboard shortly...
            </p>

            <div className="flex flex-col items-center gap-6">
                <button
                    type="button"
                    onClick={navigateToDashboard}
                    className="group relative inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-full text-base font-medium shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] focus:outline-none focus-visible:ring-2 focus:ring-emerald-500/50 active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center gap-3">
                        Go to Dashboard
                        <Icon icon="solar:arrow-right-linear" className="text-xl transition-transform group-hover:translate-x-1" />
                    </span>
                </button>

                <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium animate-pulse">
                    <span>Redirecting in</span>
                    <span className="w-5 text-center text-emerald-500 tabular-nums">{secondsLeft}</span>
                    <span>seconds</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes pop-in {
                    0% {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes draw-check {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </div>
    );
}
