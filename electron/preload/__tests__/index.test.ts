import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoist mock data so the vi.mock factory can reference them ─────────────────
// vi.mock factories are hoisted to the top of the file, which means any
// variables declared with const/let in the outer scope are in the Temporal
// Dead Zone. vi.hoisted() runs before hoisting, making the mocks available.
const { mockIpcRenderer } = vi.hoisted(() => ({
    mockIpcRenderer: {
        send: vi.fn(),
        on: vi.fn().mockReturnValue(vi.fn()),
        removeListener: vi.fn(),
    },
}));

// Stub contextIsolated to true so the preload guard doesn't throw.
// In a real Electron BrowserWindow this is always true; in Node tests it isn't.
vi.stubGlobal('process', { ...process, contextIsolated: true });


// ── Capture what contextBridge.exposeInMainWorld receives ─────────────────────
const exposedApi: Record<string, unknown> = {};

vi.mock('electron', () => ({
    contextBridge: {
        exposeInMainWorld: vi.fn((key: string, value: unknown) => {
            exposedApi[key] = value;
        }),
    },
    ipcRenderer: mockIpcRenderer,
}));

// Import preload AFTER mocks are in place so that its top-level code
// (contextBridge.exposeInMainWorld) runs against our mock.
await import('../index');

import { contextBridge } from 'electron';

// ── Type helper for the exposed API ──────────────────────────────────────────

type ExposedIpc = {
    sendAuthOauthStart: (payload: { provider: string }) => void;
    sendAuthOauthCancel: () => void;
    onAuthOauthComplete: (cb: (data: unknown) => void) => () => void;
    sendDeploymentStart: (payload: unknown) => void;
    onDeploymentSuccess: (cb: () => void) => () => void;
    onDeploymentError: (cb: (data: unknown) => void) => () => void;
};

function getIpc(): ExposedIpc {
    const api = exposedApi['electron'] as { ipcRenderer: ExposedIpc };
    return api.ipcRenderer;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('preload contextBridge API', () => {
    beforeEach(() => {
        mockIpcRenderer.send.mockReset();
        mockIpcRenderer.on.mockReset().mockReturnValue(vi.fn());
        mockIpcRenderer.removeListener.mockReset();
    });

    it('calls contextBridge.exposeInMainWorld with the key "electron"', () => {
        expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
            'electron',
            expect.objectContaining({ ipcRenderer: expect.any(Object) })
        );
    });

    it('exposes exactly the whitelisted ipcRenderer methods and no raw IPC capabilities', () => {
        const ipc = getIpc();
        const keys = Object.keys(ipc).sort();

        expect(keys).toEqual([
            'onAuthOauthComplete',
            'onDeploymentError',
            'onDeploymentSuccess',
            'sendAuthOauthCancel',
            'sendAuthOauthStart',
            'sendDeploymentStart',
        ]);

        // The raw ipcRenderer.send / .on must NOT be directly exposed
        expect(ipc).not.toHaveProperty('send');
        expect(ipc).not.toHaveProperty('on');
    });

    // ── sendAuthOauthStart ───────────────────────────────────────────────────

    it('sendAuthOauthStart sends to auth:oauth:start with the payload', () => {
        const ipc = getIpc();
        ipc.sendAuthOauthStart({ provider: 'openai-codex' });

        expect(mockIpcRenderer.send).toHaveBeenCalledOnce();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('auth:oauth:start', { provider: 'openai-codex' });
    });

    // ── sendAuthOauthCancel ──────────────────────────────────────────────────

    it('sendAuthOauthCancel sends to auth:oauth:cancel with no additional args', () => {
        const ipc = getIpc();
        ipc.sendAuthOauthCancel();

        expect(mockIpcRenderer.send).toHaveBeenCalledOnce();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('auth:oauth:cancel');
    });

    // ── onAuthOauthComplete ──────────────────────────────────────────────────

    it('onAuthOauthComplete registers a listener on auth:oauth:complete', () => {
        const ipc = getIpc();
        ipc.onAuthOauthComplete(vi.fn());

        expect(mockIpcRenderer.on).toHaveBeenCalledWith('auth:oauth:complete', expect.any(Function));
    });

    it('onAuthOauthComplete cleanup removes the listener from auth:oauth:complete', () => {
        const ipc = getIpc();
        const cleanup = ipc.onAuthOauthComplete(vi.fn());
        cleanup();

        expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
            'auth:oauth:complete',
            expect.any(Function)
        );
    });

    // ── sendDeploymentStart ──────────────────────────────────────────────────

    it('sendDeploymentStart sends to deployment:start with the payload', () => {
        const ipc = getIpc();
        const payload = { aiProvider: 'openai-api', aiModel: 'gpt-4o' };
        ipc.sendDeploymentStart(payload);

        expect(mockIpcRenderer.send).toHaveBeenCalledOnce();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('deployment:start', payload);
    });

    // ── onDeploymentSuccess ──────────────────────────────────────────────────

    it('onDeploymentSuccess registers a listener on deployment:success', () => {
        const ipc = getIpc();
        ipc.onDeploymentSuccess(vi.fn());

        expect(mockIpcRenderer.on).toHaveBeenCalledWith('deployment:success', expect.any(Function));
    });

    it('onDeploymentSuccess cleanup removes the deployment:success listener', () => {
        const ipc = getIpc();
        const cleanup = ipc.onDeploymentSuccess(vi.fn());
        cleanup();

        expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
            'deployment:success',
            expect.any(Function)
        );
    });

    // ── onDeploymentError ────────────────────────────────────────────────────

    it('onDeploymentError registers a listener on deployment:error', () => {
        const ipc = getIpc();
        ipc.onDeploymentError(vi.fn());

        expect(mockIpcRenderer.on).toHaveBeenCalledWith('deployment:error', expect.any(Function));
    });

    it('onDeploymentError cleanup removes the deployment:error listener', () => {
        const ipc = getIpc();
        const cleanup = ipc.onDeploymentError(vi.fn());
        cleanup();

        expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
            'deployment:error',
            expect.any(Function)
        );
    });

    // ── Security: raw ipcRenderer must never be forwarded ───────────────────

    it('does NOT expose the raw ipcRenderer.invoke, .sendSync, .send, or .on', () => {
        const exposedElectron = exposedApi['electron'] as Record<string, unknown>;
        const ipc = exposedElectron.ipcRenderer as Record<string, unknown>;

        // These unrestricted methods must be absent from the whitelisted API
        expect(ipc.invoke).toBeUndefined();
        expect(ipc.sendSync).toBeUndefined();
        expect(ipc.send).toBeUndefined();
        expect(ipc.on).toBeUndefined();
    });
});
