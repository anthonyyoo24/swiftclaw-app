import { useSyncExternalStore } from "react";

const ONBOARDING_COOKIE = "onboardingComplete";

// A no-op subscribe function since cookies don't emit change events we can easily listen to.
// We only need to read it once on mount for our routing guards.
const emptySubscribe = () => () => {};

const getSnapshot = () => {
    if (typeof document === "undefined") return null;
    return document.cookie;
};

const getServerSnapshot = () => null;

export type OnboardingStatus = "loading" | "complete" | "incomplete";

/**
 * Custom hook to safely read the onboarding cookie without causing hydration mismatches.
 * Uses useSyncExternalStore to return 'loading' on the server/first render,
 * and then resolves to 'complete' or 'incomplete' based on the cookie.
 */
export function useOnboardingStatus(): OnboardingStatus {
    const cookieStr = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
    
    if (cookieStr === null) {
        return "loading";
    }
    
    const hasCookie = cookieStr.split(";").some((c) => c.trim().startsWith(`${ONBOARDING_COOKIE}=`));
    return hasCookie ? "complete" : "incomplete";
}
