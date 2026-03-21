"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

/**
 * Reverse guard for /onboarding: if the user has already completed onboarding,
 * redirect them to / (the dashboard) so they can't go back to the wizard.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const status = useOnboardingStatus();

    useEffect(() => {
        if (status === "complete") {
            router.replace("/");
        }
    }, [status, router]);

    // If cookie is present (user already completed), stay null while redirecting.
    // If no cookie, wait for initial client-side check before rendering children.
    if (status !== "incomplete") {
        return null;
    }

    return <>{children}</>;
}
