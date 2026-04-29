"use client";

import { useEffect, useState } from "react";

type OpenClawSetupStatus = "loading" | "configured" | "missing";

export function useOpenClawSetupStatus(enabled: boolean): OpenClawSetupStatus {
    const [status, setStatus] = useState<OpenClawSetupStatus>("loading");

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        async function checkSetup() {
            const getSetupStatus = window.electron?.ipcRenderer.getOpenClawSetupStatus;
            if (!getSetupStatus) {
                setStatus("configured");
                return;
            }

            try {
                const setup = await getSetupStatus();
                if (!cancelled) {
                    setStatus(setup.isInstalled && setup.isConfigured ? "configured" : "missing");
                }
            } catch {
                if (!cancelled) setStatus("missing");
            }
        }

        void checkSetup();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return enabled ? status : "configured";
}
