import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IpcMainEvent } from 'electron';
import type { DeploymentPayload } from '../../../src/types/ai';

// ── Hoist mocks so factory closures can reference them ───────────────────────
const { mockDeploy, mockAuthenticate, mockCancel } = vi.hoisted(() => ({
    mockDeploy: vi.fn(),
    mockAuthenticate: vi.fn(),
    mockCancel: vi.fn(),
}));

// ── Capture ipcMain.on registrations ─────────────────────────────────────────
const ipcHandlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('electron', () => ({
    ipcMain: {
        on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
            ipcHandlers[channel] = handler;
        }),
    },
}));

// ── Mock OpenClawService as a proper constructor ──────────────────────────────
vi.mock('../OpenClawService', () => ({
    OpenClawService: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
        this.deploy = mockDeploy;
        this.authenticate = mockAuthenticate;
        this.cancel = mockCancel;
    }),
}));

import { setupIpcHandlers } from '../ipc-handlers';

function makeMockEvent() {
    return { reply: vi.fn() } as unknown as IpcMainEvent;
}

const VALID_PAYLOAD: DeploymentPayload = {
    aiAuthType: 'apiKey',
    isAiAuthenticated: false,
    aiProvider: 'openai-api',
    aiModel: 'gpt-4o',
    aiApiKey: 'sk-test-1234567890abcdef',
    selectedChannel: 'telegram',
    channelToken: 'tg-token-xyz',
    agentTemplateIds: ['maya'],
};

describe('setupIpcHandlers', () => {
    beforeEach(() => {
        mockDeploy.mockReset();
        mockAuthenticate.mockReset();
        mockCancel.mockReset();
        setupIpcHandlers();
    });

    it('registers a handler for deployment:start', () => {
        expect(ipcHandlers['deployment:start']).toBeDefined();
    });

    it('registers a handler for auth:oauth:start', () => {
        expect(ipcHandlers['auth:oauth:start']).toBeDefined();
    });

    it('registers a handler for auth:oauth:cancel', () => {
        expect(ipcHandlers['auth:oauth:cancel']).toBeDefined();
    });

    it('calls service.deploy with the event and payload when deployment:start fires', async () => {
        mockDeploy.mockResolvedValue(undefined);
        const event = makeMockEvent();

        await ipcHandlers['deployment:start'](event, VALID_PAYLOAD);

        expect(mockDeploy).toHaveBeenCalledOnce();
        expect(mockDeploy).toHaveBeenCalledWith(event, VALID_PAYLOAD);
    });

    it('calls service.authenticate with event and provider when auth:oauth:start fires', async () => {
        mockAuthenticate.mockResolvedValue(undefined);
        const event = makeMockEvent();

        await ipcHandlers['auth:oauth:start'](event, { provider: 'openai-codex' });

        expect(mockAuthenticate).toHaveBeenCalledOnce();
        expect(mockAuthenticate).toHaveBeenCalledWith(event, 'openai-codex');
    });

    it('calls service.cancel when auth:oauth:cancel fires', () => {
        ipcHandlers['auth:oauth:cancel']();
        expect(mockCancel).toHaveBeenCalledOnce();
    });

    it('does NOT log the raw apiKey or channelToken (sanitization)', async () => {
        mockDeploy.mockResolvedValue(undefined);
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const event = makeMockEvent();
        const sensitivePayload: DeploymentPayload = {
            ...VALID_PAYLOAD,
            aiApiKey: 'sk-ultrasecretkey99',
            channelToken: 'super-secret-channel-token',
        };

        await ipcHandlers['deployment:start'](event, sensitivePayload);

        const logged = consoleSpy.mock.calls.flat().map(String).join(' ');
        expect(logged).not.toContain('sk-ultrasecretkey99');
        expect(logged).not.toContain('super-secret-channel-token');

        consoleSpy.mockRestore();
    });
});
