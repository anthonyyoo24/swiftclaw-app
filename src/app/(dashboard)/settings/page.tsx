"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { clearOnboardingCompleteCookie } from "@/hooks/useOnboardingStatus";

export default function SettingsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [resetting, setResetting] = useState(false);
    const clearAll = useMutation(api.reset.clearAll);

    const handleReset = async () => {
        setResetting(true);
        try {
            await clearAll();
            const result = await window.electron?.ipcRenderer.resetOpenClaw();
            if (!result?.success) {
                toast.error(result?.error ?? "Reset failed. Please try again.");
            }
            clearOnboardingCompleteCookie();
            window.location.href = "/onboarding";
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Reset failed. Please try again.");
        } finally {
            setResetting(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col bg-transparent relative min-w-0 h-full p-6">
            <h1 className="text-lg font-semibold text-white mb-8">Settings</h1>

            <div className="border border-red-500/20 rounded-lg p-5 max-w-lg">
                <h2 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
                <p className="text-xs text-neutral-400 mb-4">
                    Remove all OpenClaw data from your computer and reset the app to its initial state.
                    This action cannot be undone.
                </p>
                <Button
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    disabled={resetting}
                    onClick={() => setDialogOpen(true)}
                >
                    {resetting ? "Resetting…" : "Reset Everything"}
                </Button>
            </div>

            <ConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title="Reset Everything?"
                description="This will remove all OpenClaw data from your computer, including agents, config, and credentials. You will be taken back to the setup wizard. This cannot be undone."
                confirmLabel="Reset Everything"
                onConfirm={handleReset}
            />
        </main>
    );
}
