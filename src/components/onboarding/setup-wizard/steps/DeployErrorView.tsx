"use client";

import { Icon } from "@iconify/react";

interface DeployErrorViewProps {
    error: string;
    onRetry: () => void;
}

/**
 * Displayed when the deployment process fails.
 * Shows the error message and a retry button.
 */
export function DeployErrorView({ error, onRetry }: DeployErrorViewProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 min-h-100">
            {/* Error Icon */}
            <div className="relative w-28 h-28 mb-8">
                {/* Glowing background */}
                <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl animate-pulse" />

                {/* Icon container */}
                <div className="relative w-full h-full rounded-full border-2 border-red-500/50 flex items-center justify-center">
                    <Icon
                        icon="solar:danger-triangle-bold-duotone"
                        className="text-red-500 text-5xl drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]"
                        style={{
                            animation: "pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                        }}
                    />
                </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">
                Deployment Failed
            </h2>

            <p className="text-neutral-400 text-center max-w-sm mb-4">
                Something went wrong during the deployment process.
            </p>

            {/* Error message box */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-5 py-3 max-w-md mb-8">
                <p className="text-red-400 text-sm font-mono text-center wrap-break-word">
                    {error}
                </p>
            </div>

            <button
                type="button"
                onClick={onRetry}
                className="group relative inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-10 py-4 rounded-full text-base font-medium shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus:ring-neutral-500/50 active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
            >
                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-3">
                    <Icon icon="solar:restart-bold" className="text-xl" />
                    Try Again
                </span>
            </button>

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
            `}</style>
        </div>
    );
}
