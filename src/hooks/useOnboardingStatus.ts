import { useSyncExternalStore } from "react";

const ONBOARDING_COOKIE = "onboardingComplete";

const ONBOARDING_CHANGED_EVENT = "onboarding-status-changed";

/**
 * Dispatches a custom window event to notify all useOnboardingStatus hooks 
 * that the cookie has been mutated and they should re-read it.
 */
export const dispatchOnboardingStatusChanged = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(ONBOARDING_CHANGED_EVENT));
    }
};

export const clearOnboardingCompleteCookie = () => {
    if (typeof document === "undefined") return;
    const isSecure = typeof window !== "undefined" && window.isSecureContext;
    document.cookie = `${ONBOARDING_COOKIE}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? "; Secure" : ""}`;
    dispatchOnboardingStatusChanged();
};

export const setOnboardingCompleteCookie = () => {
    if (typeof document === "undefined") return;
    const isSecure = typeof window !== "undefined" && window.isSecureContext;
    document.cookie = `${ONBOARDING_COOKIE}=true; path=/; max-age=31536000; SameSite=Lax${isSecure ? "; Secure" : ""}`;
    dispatchOnboardingStatusChanged();
};

const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => { };

    window.addEventListener(ONBOARDING_CHANGED_EVENT, callback);
    return () => window.removeEventListener(ONBOARDING_CHANGED_EVENT, callback);
};

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
    const cookieStr = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    
    if (cookieStr === null) {
        return "loading";
    }
    
    const cookie = cookieStr
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${ONBOARDING_COOKIE}=`));
    return cookie === `${ONBOARDING_COOKIE}=true` ? "complete" : "incomplete";
}
