"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { Icon } from "@iconify/react";

/**
 * Client-side guard for the (dashboard) route group.
 * In static-export (Electron) mode, server middleware is unavailable,
 * so we check the onboarding cookie client-side before rendering.
 * Renders null (blank) until the check completes, preventing dashboard flash.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const status = useOnboardingStatus();

    useEffect(() => {
        if (status === "incomplete") {
            router.replace("/onboarding");
        }
    }, [status, router]);

    // Only render children if we have explicitly confirmed authorization on the client.
    // This prevents the dashboard from being baked into static HTML or "flashing" before redirect.
    if (status !== "complete") {
        return (
            <div 
                className="flex h-screen w-full flex-col items-center justify-center bg-black gap-4"
                role="status"
                aria-busy="true"
            >
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-400 opacity-20 animate-spin transition-all duration-1000" />
                    <Icon 
                        icon="solar:refresh-bold" 
                        className="size-8 text-blue-400 animate-spin" 
                    />
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400/80 uppercase">
                        SwiftClaw
                    </span>
                    <span className="text-[9px] font-medium text-neutral-500 tracking-[0.3em] uppercase">
                        Verifying Session
                    </span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
