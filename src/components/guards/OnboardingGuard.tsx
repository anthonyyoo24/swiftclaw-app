"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearOnboardingCompleteCookie, useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useOpenClawSetupStatus } from "@/hooks/useOpenClawSetupStatus";

/**
 * Reverse guard for /onboarding: if the user has already completed onboarding,
 * redirect them to / (the dashboard) so they can't go back to the wizard.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const status = useOnboardingStatus();
    const setupStatus = useOpenClawSetupStatus(status === "complete");

    useEffect(() => {
        if (setupStatus === "missing") {
            clearOnboardingCompleteCookie();
            return;
        }

        if (status === "complete" && setupStatus === "configured") {
            router.replace("/");
        }
    }, [status, setupStatus, router]);

    // If cookie is present (user already completed), stay null while redirecting.
    // If no cookie, wait for initial client-side check before rendering children.
    if (status === "loading" || setupStatus === "loading") {
        return null;
    }

    if (status === "complete" && setupStatus === "configured") {
        return null;
    }

    return <>{children}</>;
}
