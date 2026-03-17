import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
    /** Text shown after the "/" separator, e.g. "Workspace" or "Setup Wizard" */
    subtitle: string;
    /** Optional content rendered on the right side of the header */
    rightSlot?: React.ReactNode;
    /** Extra className for the header element, useful for padding overrides */
    className?: string;
}

/**
 * Shared top-bar used by both the dashboard layout and the onboarding WizardShell.
 * Renders the SwiftClaw logo + "SwiftClaw / {subtitle}" breadcrumb.
 */
export function AppHeader({ subtitle, rightSlot, className }: AppHeaderProps) {
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

            {rightSlot && <div className="flex items-center">{rightSlot}</div>}
        </header>
    );
}
