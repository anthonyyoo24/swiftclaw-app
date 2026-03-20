"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { GatewayStatus, GatewayStatusType } from "./GatewayStatus";

interface AppHeaderProps {
    /** Text shown after the "/" separator, e.g. "Workspace" or "Setup Wizard" */
    subtitle: string;
    /** Optional content rendered on the right side of the header */
    rightSlot?: React.ReactNode;
    /** Current status of the gateway */
    gatewayStatus?: GatewayStatusType;
    /** Extra className for the header element, useful for padding overrides */
    className?: string;
    /** Whether to show the Reset Onboarding button. Defaults to true. */
    showReset?: boolean;
    /** Whether to show the Gateway Status. Defaults to true. */
    showGatewayStatus?: boolean;
    /** Optional callback when the Reset button is clicked. If not provided, it clears the cookie and redirects to /onboarding. */
    onReset?: () => void;
}

/**
 * Shared top-bar used by both the dashboard layout and the onboarding WizardShell.
 * Renders the SwiftClaw logo + "SwiftClaw / {subtitle}" breadcrumb.
 */
export function AppHeader({
    subtitle,
    rightSlot,
    gatewayStatus = "error",
    className,
    showReset = true,
    showGatewayStatus = true,
    onReset
}: AppHeaderProps) {

    const handleResetOnboarding = () => {
        if (onReset) {
            onReset();
            return;
        }

        // Default behavior: Clear the onboarding cookie and hard redirect
        document.cookie = "onboardingComplete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        window.location.href = "/onboarding";
    };

    return (
        <header
            className={cn(
                "flex items-center justify-between px-5 py-4 border-b border-white/5 bg-transparent z-20 shrink-0",
                className
            )}
        >
            <div className="flex items-center gap-4">
                {/* App Logo */}
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    <Icon icon="solar:bolt-linear" className="text-lg" />
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="font-medium text-sm text-white">SwiftClaw</span>
                    <span className="text-neutral-700">/</span>
                    <span className="text-neutral-400 font-medium text-sm">{subtitle}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {showReset && (
                    <button
                        onClick={handleResetOnboarding}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all duration-200 group no-drag cursor-pointer border border-transparent hover:border-white/10"
                        title="Reset Onboarding Flow"
                    >
                        <Icon
                            icon="solar:restart-linear"
                            className="text-sm transition-transform group-hover:rotate-180 duration-500"
                        />
                        Reset
                    </button>
                )}

                {showReset && showGatewayStatus && (
                    <div className="h-4 w-px bg-white/10 mx-0.5" />
                )}

                {showGatewayStatus && <GatewayStatus status={gatewayStatus} />}
                {rightSlot && <div className="flex items-center">{rightSlot}</div>}
            </div>
        </header>
    );
}
