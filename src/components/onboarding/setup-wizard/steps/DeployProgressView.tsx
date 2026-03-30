"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

const UI_STEPS = [
    "Authenticating with Provider...",
    "Linking your Channels...",
    "Assembling Workspaces...",
    "Personalizing Profile...",
    "Finalizing agent startup..."
];

const TOTAL_STEPS = UI_STEPS.length;
const COMPLETION_DURATION_MS = 250;

interface DeployProgressViewProps {
    duration: number;
    backendComplete: boolean;
    onVisualComplete: () => void;
}

/**
 * Visual component for the deployment loading animation.
 *
 * Two-phase progress model:
 *  - Phase 1 (timer-driven): auto-advances through UI_STEPS from 0% to 90% over `duration` ms.
 *  - Phase 2 (backend-driven): triggered when `backendComplete` is true and Phase 1 has
 *    finished. Animates from 90% to 100% over COMPLETION_DURATION_MS, then calls
 *    `onVisualComplete` so the parent can transition to the success view.
 *
 * If `backendComplete` arrives before Phase 1 finishes, Phase 1 still runs to completion
 * and Phase 2 starts immediately afterward.
 */
export function DeployProgressView({ duration, backendComplete, onVisualComplete }: DeployProgressViewProps) {
    const [displayedStep, setDisplayedStep] = useState(0);
    const [completing, setCompleting] = useState(false);
    const onVisualCompleteRef = useRef(onVisualComplete);
    useEffect(() => { onVisualCompleteRef.current = onVisualComplete; }, [onVisualComplete]);

    const stepDuration = duration / TOTAL_STEPS;
    const phase1Done = displayedStep >= TOTAL_STEPS;

    // Phase 1: timer-driven progress 0 → 90%
    useEffect(() => {
        const initialTimeout = setTimeout(() => {
            setDisplayedStep(1);
        }, 50);

        const interval = setInterval(() => {
            setDisplayedStep((prev) => {
                const next = prev + 1;
                if (next >= TOTAL_STEPS) {
                    clearInterval(interval);
                    return TOTAL_STEPS;
                }
                return next;
            });
        }, stepDuration);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [stepDuration]);

    // Trigger Phase 2 once Phase 1 is done and the backend has confirmed success.
    // If backendComplete arrives early, this fires the moment Phase 1 finishes.
    useEffect(() => {
        if (phase1Done && backendComplete && !completing) {
            setCompleting(true);
        }
    }, [phase1Done, backendComplete, completing]);

    // After the 250ms completion animation, notify the parent to show the success view.
    useEffect(() => {
        if (!completing) return;
        const timeout = setTimeout(() => {
            onVisualCompleteRef.current();
        }, COMPLETION_DURATION_MS);
        return () => clearTimeout(timeout);
    }, [completing]);

    // Derived display values
    const rawPercent = completing ? 100 : Math.min((displayedStep / TOTAL_STEPS) * 100, 90);
    const transitionDuration = completing ? COMPLETION_DURATION_MS : stepDuration;
    const messageIndex = Math.min(Math.max(0, displayedStep - 1), TOTAL_STEPS - 1);
    const currentMessage = UI_STEPS[messageIndex];

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
                    {currentMessage}
                </p>
            </div>

            {/* Linear progress bar */}
            <div
                className="w-64 max-w-full h-1 bg-white/5 rounded-full overflow-hidden relative"
                role="progressbar"
                aria-label="Deployment progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(rawPercent)}
                aria-valuetext={currentMessage}
            >
                <div
                    className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full absolute left-0 top-0 transition-all ease-linear"
                    style={{
                        width: `${rawPercent}%`,
                        transitionDuration: `${transitionDuration}ms`
                    }}
                />
            </div>
        </div>
    );
}
