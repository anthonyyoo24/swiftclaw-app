"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const LOADING_MESSAGES = [
    "Starting your deployment...",
    "Connecting to your AI provider...",
    "Establishing channel connection...",
    "Finalizing agent startup...",
];

interface DeployProgressViewProps {
    duration: number;
}

export function DeployProgressView({ duration }: DeployProgressViewProps) {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const messageInterval = duration / LOADING_MESSAGES.length;
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, messageInterval);

        return () => clearInterval(interval);
    }, [duration]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 min-h-100">
            <div className="relative w-24 h-24 mb-8">
                {/* Outer glowing ring */}
                <div className="absolute inset-0 rounded-full border border-blue-500/30 bg-blue-500/5 animate-pulse" />

                {/* Spinning dual rings */}
                <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-400 opacity-60 animate-spin transition-all duration-1000" />
                <div className="absolute inset-2 rounded-full border-l-2 border-r-2 border-indigo-400 opacity-40 animate-spin animation-duration-[1.5s] transition-all" />

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center text-blue-400">
                    <Icon icon="solar:rocket-bold-duotone" className="text-4xl animate-pulse" />
                </div>
            </div>

            <h2 className="text-xl font-medium text-white mb-2">Deploying Agent</h2>

            <div
                className="h-6 mb-8 relative font-mono text-sm w-full text-center"
                role="status"
                aria-live="polite"
            >
                <p className="text-neutral-400 transition-opacity duration-300">
                    {LOADING_MESSAGES[messageIndex]}
                </p>
            </div>

            {/* Linear progress bar */}
            <div
                className="w-64 max-w-full h-1 bg-white/5 rounded-full overflow-hidden relative"
                role="progressbar"
                aria-label="Deployment progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(((messageIndex + 1) / LOADING_MESSAGES.length) * 100)}
                aria-valuetext={LOADING_MESSAGES[messageIndex]}
            >
                <div
                    className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full absolute left-0 top-0 w-full animate-[linear-fill_var(--fill-duration)_linear_forwards]"
                    style={{
                        transform: 'translateX(-100%)',
                        ['--fill-duration' as string]: `${duration}ms`
                    } as React.CSSProperties}
                />
            </div>

            <style jsx>{`
                @keyframes linear-fill {
                    to {
                        transform: translateX(0%);
                    }
                }
            `}</style>
        </div>
    );
}
