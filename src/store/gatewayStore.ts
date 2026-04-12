"use client";

import { create } from "zustand";
import pkg from "../../package.json";

export type GatewayConnectionStatus = "offline" | "connecting" | "connected" | "error";

export type GatewayAuth = { token?: string; password?: string };

export type AgentSession = {
    sessionKey: string;
    name: string;
    role: string;
};

type InvokeSkillPayload = {
    skill: string;
    sessionKey: string;
    args?: Record<string, unknown>;
};

type PendingRequest = {
    resolve: (value: unknown) => void;
    reject: (err: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
};

type GatewayState = {
    status: GatewayConnectionStatus;
    sessions: AgentSession[];
    connect: (port: number, auth?: GatewayAuth) => void;
    reconnect: () => void;
    disconnect: () => void;
    listSessions: () => Promise<AgentSession[]>;
    invokeSkill: (payload: InvokeSkillPayload) => Promise<unknown>;
};

const REQUEST_TIMEOUT_MS = 15_000;
const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 10_000;
const BACKOFF_MAX_ATTEMPTS = 10;
const CLIENT_ID = "gateway-client";

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const devLog = (...args: unknown[]) => { if (process.env.NODE_ENV === 'development') console.log(...args); };

let ws: WebSocket | null = null;
let currentPort: number | null = null;
let currentAuth: GatewayAuth = {};
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isIntentionallyClosed = false;
const pending = new Map<string, PendingRequest>();

function clearReconnectTimer() {
    if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function rejectAllPending(reason: string) {
    for (const [, req] of pending) {
        clearTimeout(req.timeoutId);
        req.reject(new Error(reason));
    }
    pending.clear();
}

function scheduleReconnect(port: number, setStatus: (s: GatewayConnectionStatus) => void) {
    if (isIntentionallyClosed || reconnectAttempt >= BACKOFF_MAX_ATTEMPTS) return;

    const delay = Math.min(BACKOFF_BASE_MS * 2 ** reconnectAttempt, BACKOFF_MAX_MS);
    reconnectAttempt++;

    clearReconnectTimer();
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        openConnection(port, setStatus, currentAuth);
    }, delay);
}

function openConnection(port: number, setStatus: (s: GatewayConnectionStatus) => void, auth: GatewayAuth = {}) {
    if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
        ws = null;
    }

    setStatus("connecting");
    currentPort = port;

    devLog(`[gateway] connecting to ws://localhost:${port} (attempt ${reconnectAttempt + 1})`);

    const socket = new WebSocket(`ws://localhost:${port}`);
    ws = socket;

    socket.onopen = () => {
        devLog("[gateway] websocket open — waiting for connect.challenge");
    };

    socket.onmessage = (event: MessageEvent) => {
        let frame: Record<string, unknown>;
        try {
            frame = JSON.parse(event.data as string) as Record<string, unknown>;
        } catch {
            return;
        }

        // Server sends connect.challenge first — respond with our connect request
        if (frame.type === "event" && frame.event === "connect.challenge") {
            devLog("[gateway] challenge received — sending connect request");
            const authField = auth.token
                ? { token: auth.token }
                : auth.password
                    ? { password: auth.password }
                    : undefined;

            const connectReq = {
                type: "req",
                id: "connect-handshake",
                method: "connect",
                params: {
                    minProtocol: 3,
                    maxProtocol: 3,
                    role: "operator",
                    scopes: ["operator.read"],
                    ...(authField ? { auth: authField } : {}),
                    client: {
                        id: CLIENT_ID,
                        displayName: "SwiftClaw Dashboard",
                        version: pkg.version,
                        platform: navigator.platform,
                        mode: "ui",
                        instanceId: generateId(),
                    },
                },
            };
            socket.send(JSON.stringify(connectReq));
            return;
        }

        if (frame.type === "res") {
            if (frame.id === "connect-handshake") {
                if (frame.ok === true) {
                    devLog("[gateway] handshake accepted — connected");
                    reconnectAttempt = 0;
                    setStatus("connected");
                } else {
                    const reason = (frame.error as Record<string, unknown> | undefined)?.message ?? frame.error ?? "unknown";
                    console.warn(`[gateway] handshake rejected: ${JSON.stringify(reason)}`);
                    socket.close();
                }
                return;
            }

            const req = pending.get(frame.id as string);
            if (req) {
                clearTimeout(req.timeoutId);
                pending.delete(frame.id as string);
                if (frame.ok === true) {
                    req.resolve(frame.payload);
                } else {
                    const err = frame.error as Record<string, unknown> | undefined;
                    req.reject(new Error((err?.message as string) ?? "gateway request failed"));
                }
            }
        }
    };

    socket.onclose = () => {
        ws = null;
        rejectAllPending("gateway disconnected");
        const willReconnect =
            !isIntentionallyClosed &&
            currentPort !== null &&
            reconnectAttempt < BACKOFF_MAX_ATTEMPTS;
        if (willReconnect) {
            const delay = Math.min(BACKOFF_BASE_MS * 2 ** reconnectAttempt, BACKOFF_MAX_MS);
            devLog(`[gateway] disconnected — retrying in ${delay}ms (attempt ${reconnectAttempt + 1}/${BACKOFF_MAX_ATTEMPTS})`);
            setStatus("connecting");
            scheduleReconnect(currentPort!, setStatus);
        } else if (isIntentionallyClosed) {
            devLog("[gateway] disconnected intentionally");
            setStatus("offline");
        } else {
            console.warn(`[gateway] max reconnect attempts reached — giving up`);
            setStatus("error");
        }
    };

    socket.onerror = () => {
        // onclose will fire after onerror; let it handle reconnection
    };
}

function sendRequest<T>(method: string, params?: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            reject(new Error("gateway not connected"));
            return;
        }

        const id = generateId();
        const timeoutId = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`gateway request timeout: ${method}`));
        }, REQUEST_TIMEOUT_MS);

        pending.set(id, {
            resolve: resolve as (v: unknown) => void,
            reject,
            timeoutId,
        });

        ws.send(JSON.stringify({ type: "req", id, method, params: params ?? {} }));
    });
}

export const useGatewayStore = create<GatewayState>((set, get) => ({
    status: "offline",
    sessions: [],

    connect(port: number, auth: GatewayAuth = {}) {
        currentAuth = auth;
        isIntentionallyClosed = false;
        reconnectAttempt = 0;
        clearReconnectTimer();
        openConnection(port, (status) => set({ status }), auth);
    },

    reconnect() {
        if (currentPort === null) return;
        isIntentionallyClosed = false;
        reconnectAttempt = 0;
        clearReconnectTimer();
        openConnection(currentPort, (status) => set({ status }), currentAuth);
    },

    disconnect() {
        isIntentionallyClosed = true;
        clearReconnectTimer();
        rejectAllPending("disconnected by client");
        if (ws) {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onclose = null;
            ws.onerror = null;
            ws.close();
            ws = null;
        }
        set({ status: "offline", sessions: [] });
    },

    async listSessions(): Promise<AgentSession[]> {
        type SessionsListPayload = {
            sessions?: Array<{
                key: string;
                displayName?: string;
                provider?: string;
                chatType?: string;
            }>;
        };

        const payload = await sendRequest<SessionsListPayload>("sessions.list", {});
        const sessions: AgentSession[] = (payload?.sessions ?? []).map((s) => ({
            sessionKey: s.key,
            name: s.displayName ?? s.key,
            role: "agent",
        }));
        set({ sessions });
        return sessions;
    },

    async invokeSkill(payload: InvokeSkillPayload): Promise<unknown> {
        return sendRequest("agent", {
            sessionKey: payload.sessionKey,
            message: payload.skill,
            args: payload.args ?? {},
        });
    },
}));
