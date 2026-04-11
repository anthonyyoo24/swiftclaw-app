"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useGatewayStore } from "@/store/gatewayStore";

const DEFAULT_PORT = 18789;

/**
 * Headless component mounted in the dashboard layout.
 * - Reads the gateway port from Electron IPC (falls back to 18789)
 * - Initiates the WebSocket connection via gatewayStore
 * - On connect, fetches sessions and upserts each into Convex
 */
export function GatewaySyncManager() {
    // Pre-warm tasks cache so TaskBoard never hits the undefined loading state
    useQuery(api.tasks.list, {});

    const status = useGatewayStore((s) => s.status);
    const connect = useGatewayStore((s) => s.connect);
    const disconnect = useGatewayStore((s) => s.disconnect);
    const listSessions = useGatewayStore((s) => s.listSessions);
    const syncAgent = useMutation(api.agents.syncAgent);
    const hasSynced = useRef(false);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        let cancelled = false;

        async function init() {
            let port = DEFAULT_PORT;
            if (typeof window !== "undefined" && window.electron?.ipcRenderer?.getGatewayPort) {
                try {
                    port = await window.electron.ipcRenderer.getGatewayPort();
                } catch {
                    // fall through to default
                }
            }
            if (!cancelled) {
                connect(port);
            }
        }

        void init();
        return () => {
            cancelled = true;
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync agents whenever the connection transitions to "connected"
    useEffect(() => {
        if (status !== "connected") {
            hasSynced.current = false;
            return;
        }
        if (hasSynced.current) return;
        hasSynced.current = true;

        void (async () => {
            try {
                const sessions = await listSessions();
                await Promise.all(
                    sessions.map((s) =>
                        syncAgent({
                            name: s.name,
                            role: s.role,
                            sessionKey: s.sessionKey,
                        })
                    )
                );
            } catch {
                // Non-fatal: sync will retry on next reconnect
            }
        })();
    }, [status, listSessions, syncAgent]);

    return null;
}
