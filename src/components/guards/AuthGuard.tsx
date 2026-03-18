"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

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
        return null;
    }

    return <>{children}</>;
}
