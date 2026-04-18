import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IpcMainEvent } from 'electron';
import type { DeploymentPayload } from '../../../src/types/ai';

// ── Hoist mocks so factory closures can reference them ───────────────────────
const { mockDeploy, mockAuthenticate, mockCancel, mockPauseAgent, mockResumeAgent, mockExistsSync, mockReadFileSync, mockSpawn, mockSpawnSync } = vi.hoisted(() => ({
    mockDeploy: vi.fn(),
    mockAuthenticate: vi.fn(),
    mockCancel: vi.fn(),
    mockPauseAgent: vi.fn(),
    mockResumeAgent: vi.fn(),
    mockExistsSync: vi.fn<(path: string) => boolean>(),
    mockReadFileSync: vi.fn<(path: string, encoding: string) => string>(),
    mockSpawn: vi.fn(() => ({ unref: vi.fn(), on: vi.fn() })),
    mockSpawnSync: vi.fn(() => ({ status: 0 })),
}));

// ── Capture ipcMain.on and ipcMain.handle registrations ──────────────────────
const ipcHandlers: Record<string, (...args: unknown[]) => unknown> = {};
const ipcInvokeHandlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('electron', () => ({
    app: {
        isPackaged: false,
        getAppPath: vi.fn(() => '/'),
        on: vi.fn(),
    },
    ipcMain: {
        on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
            ipcHandlers[channel] = handler;
        }),
        handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
            ipcInvokeHandlers[channel] = handler;
        }),
    },
}));

vi.mock('fs', () => ({
    default: {
        existsSync: mockExistsSync,
        readFileSync: mockReadFileSync,
    },
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
}));

vi.mock('child_process', () => ({
    spawn: mockSpawn,
    spawnSync: mockSpawnSync,
}));

// ── Mock OpenClawService as a proper constructor ──────────────────────────────
vi.mock('../OpenClawService', () => ({
    OpenClawService: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
        this.deploy = mockDeploy;
        this.authenticate = mockAuthenticate;
        this.cancel = mockCancel;
        this.pauseAgent = mockPauseAgent;
        this.resumeAgent = mockResumeAgent;
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
    userName: 'Test User',
    timezone: 'America/New_York',
    usageType: 'business',
    businessDescription: 'A test business',
    goals: 'Build amazing software',
    workflows: ['write-code', 'review-prs'],
    convexUrl: 'https://test-deployment.convex.cloud',
};

describe('setupIpcHandlers', () => {
    beforeEach(() => {
        mockDeploy.mockReset();
        mockAuthenticate.mockReset();
        mockCancel.mockReset();
        mockPauseAgent.mockReset();
        mockResumeAgent.mockReset();
        mockExistsSync.mockReset();
        mockReadFileSync.mockReset();
        mockSpawn.mockReset().mockReturnValue({ unref: vi.fn(), on: vi.fn() });
        mockSpawnSync.mockReset().mockReturnValue({ status: 0 });
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

    it('logs empty string (not undefined) for missing aiApiKey and channelToken', async () => {
        mockDeploy.mockResolvedValue(undefined);
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const event = makeMockEvent();

        await ipcHandlers['deployment:start'](event, { ...VALID_PAYLOAD, aiApiKey: '', channelToken: '' });

        expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
        const deploymentLogCall = consoleSpy.mock.calls.find(
            (call) => call[0] === 'Received deployment:start with payload:'
        );
        expect(deploymentLogCall).toBeDefined();
        const loggedPayload = deploymentLogCall![1] as DeploymentPayload;
        expect(loggedPayload.aiApiKey).toBe('');
        expect(loggedPayload.channelToken).toBe('');

        consoleSpy.mockRestore();
    });

    describe('gateway:get-port handler', () => {
        it('registers a handler for gateway:get-port', () => {
            expect(ipcInvokeHandlers['gateway:get-port']).toBeDefined();
        });

        it('returns 18789 when the config file does not exist', () => {
            mockExistsSync.mockReturnValue(false);
            const result = ipcInvokeHandlers['gateway:get-port']();
            expect(result).toBe(18789);
        });

        it('returns the gateway.port value from the config file', () => {
            mockExistsSync.mockReturnValue(true);
            mockReadFileSync.mockReturnValue(JSON.stringify({ gateway: { port: 19000 } }));
            const result = ipcInvokeHandlers['gateway:get-port']();
            expect(result).toBe(19000);
        });

        it('returns 18789 when the config file has no gateway.port field', () => {
            mockExistsSync.mockReturnValue(true);
            mockReadFileSync.mockReturnValue(JSON.stringify({ gateway: {} }));
            const result = ipcInvokeHandlers['gateway:get-port']();
            expect(result).toBe(18789);
        });

        it('returns 18789 when the config file contains invalid JSON', () => {
            mockExistsSync.mockReturnValue(true);
            mockReadFileSync.mockReturnValue('not-valid-json{{');
            const result = ipcInvokeHandlers['gateway:get-port']();
            expect(result).toBe(18789);
        });
    });

    describe('agent:pause handler', () => {
        it('registers a handler for agent:pause', () => {
            expect(ipcInvokeHandlers['agent:pause']).toBeDefined();
        });

        it('calls service.pauseAgent with the agentName when agent:pause fires', async () => {
            mockPauseAgent.mockResolvedValue({ success: true });

            await ipcInvokeHandlers['agent:pause'](undefined, { agentName: 'maya' });

            expect(mockPauseAgent).toHaveBeenCalledOnce();
            expect(mockPauseAgent).toHaveBeenCalledWith('maya');
        });
    });

    describe('agent:resume handler', () => {
        it('registers a handler for agent:resume', () => {
            expect(ipcInvokeHandlers['agent:resume']).toBeDefined();
        });

        it('calls service.resumeAgent with the agentName when agent:resume fires', async () => {
            mockResumeAgent.mockResolvedValue({ success: true });

            await ipcInvokeHandlers['agent:resume'](undefined, { agentName: 'maya' });

            expect(mockResumeAgent).toHaveBeenCalledOnce();
            expect(mockResumeAgent).toHaveBeenCalledWith('maya');
        });
    });
});
