import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { EventEmitter } from 'events';
import type { IpcMainEvent } from 'electron';
import type { DeploymentPayload } from '../../../src/types/ai';

// ── Mock child_process before importing the service ──────────────────────────
vi.mock('child_process', () => ({
    spawn: vi.fn(),
}));

// ── Mock electron (only used for types at runtime) ───────────────────────────
vi.mock('electron', () => ({
    ipcMain: { on: vi.fn() },
}));

// ── Mock fs so we don't touch the real filesystem ───────────────────────────
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(() => false),
        statSync: vi.fn(() => ({ mtimeMs: 0 })),
        readFileSync: vi.fn(() => '{}'),
        writeFileSync: vi.fn(),
    },
}));

import * as childProcess from 'child_process';
import { OpenClawService } from '../OpenClawService';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a fake ChildProcess EventEmitter that exits with the given code.
 * Uses a microtask (Promise.resolve) to emit close so listeners are attached first.
 */
function makeFakeProcess(exitCode = 0) {
    const proc = new EventEmitter() as ReturnType<typeof childProcess.spawn>;
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    (proc as unknown as Record<string, unknown>).stdout = stdout;
    (proc as unknown as Record<string, unknown>).stderr = stderr;
    (proc as unknown as Record<string, boolean>).killed = false;
    (proc as unknown as Record<string, () => void>).kill = vi.fn();

    // Emit close via microtask so listeners attached synchronously are ready
    Promise.resolve().then(() => proc.emit('close', exitCode));

    return proc;
}

function makeMockEvent() {
    return { reply: vi.fn() } as unknown as IpcMainEvent;
}

const BASE_PAYLOAD: DeploymentPayload = {
    aiAuthType: 'apiKey',
    isAiAuthenticated: false,
    aiProvider: 'openai-api',
    aiModel: 'gpt-4o',
    aiApiKey: 'sk-test-1234567890abcdef',
    selectedChannel: 'telegram',
    channelToken: 'tg-token-xyz',
    agentTemplateIds: ['maya'],
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('OpenClawService.deploy()', () => {
    let spawnMock: MockInstance;
    let service: OpenClawService;

    beforeEach(() => {
        vi.useFakeTimers();
        spawnMock = vi.mocked(childProcess.spawn);
        spawnMock.mockReset();
        service = new OpenClawService();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls spawn with openclaw onboard and the correct base flags', async () => {
        spawnMock.mockReturnValue(makeFakeProcess(0));
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await deployPromise;

        expect(spawnMock).toHaveBeenCalledOnce();
        const [cmd, args] = spawnMock.mock.calls[0];

        expect(cmd).toMatch(/^npx/);
        expect(args).toContain('openclaw@latest');
        expect(args).toContain('onboard');
        expect(args).toContain('--non-interactive');
        expect(args).toContain('--accept-risk');
        expect(args).toContain('--auth-choice');
        expect(args).toContain('openai-api-key');
        expect(args).toContain('--openai-api-key');
        expect(args).toContain(BASE_PAYLOAD.aiApiKey);
    });

    it('emits deployment:progress at step 1 before calling spawn', async () => {
        spawnMock.mockReturnValue(makeFakeProcess(0));
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await deployPromise;

        const firstReply = (event.reply as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(firstReply[0]).toBe('deployment:progress');
        expect(firstReply[1]).toMatchObject({ step: 1 });
    });

    it('emits deployment:success after a successful run', async () => {
        spawnMock.mockReturnValue(makeFakeProcess(0));
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await deployPromise;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        const successReply = replies.find(([channel]) => channel === 'deployment:success');
        expect(successReply).toBeDefined();
        expect(successReply![1]).toMatchObject({ success: true });
    });

    it('emits deployment:error and no success when spawn exits non-zero', async () => {
        spawnMock.mockReturnValue(makeFakeProcess(1));
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await deployPromise;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        const errorReply = replies.find(([channel]) => channel === 'deployment:error');
        expect(errorReply).toBeDefined();
        expect(errorReply![1]).toHaveProperty('message');

        const successReply = replies.find(([channel]) => channel === 'deployment:success');
        expect(successReply).toBeUndefined();
    });

    it('emits deployment:error immediately when oauth but not authenticated', async () => {
        const event = makeMockEvent();
        const deployPromise = service.deploy(event, {
            ...BASE_PAYLOAD,
            aiAuthType: 'oauth',
            isAiAuthenticated: false,
        });
        await vi.runAllTimersAsync();
        await deployPromise;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        const errorReply = replies.find(([channel]) => channel === 'deployment:error');
        expect(errorReply).toBeDefined();
        expect(spawnMock).not.toHaveBeenCalled();
    });

    it('ignores a concurrent deploy call and emits error for the second', async () => {
        // First process never exits on its own
        const proc = new EventEmitter() as ReturnType<typeof childProcess.spawn>;
        (proc as unknown as Record<string, unknown>).stdout = new EventEmitter();
        (proc as unknown as Record<string, unknown>).stderr = new EventEmitter();
        (proc as unknown as Record<string, boolean>).killed = false;
        (proc as unknown as Record<string, () => void>).kill = vi.fn();
        spawnMock.mockReturnValueOnce(proc);

        const event1 = makeMockEvent();
        const event2 = makeMockEvent();

        // Start first deploy — don't await
        const firstDeploy = service.deploy(event1, BASE_PAYLOAD);

        // Second deploy should reject immediately
        const secondDeploy = service.deploy(event2, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await secondDeploy;

        const replies2 = (event2.reply as ReturnType<typeof vi.fn>).mock.calls;
        const errorReply = replies2.find(([channel]) => channel === 'deployment:error');
        expect(errorReply).toBeDefined();

        // Finish first deploy
        proc.emit('close', 0);
        await vi.runAllTimersAsync();
        await firstDeploy;
    });
});

// ── sanitizeArgs ──────────────────────────────────────────────────────────────

describe('OpenClawService sanitizeArgs (via spawn log)', () => {
    let spawnMock: MockInstance;
    let consoleSpy: MockInstance;

    beforeEach(() => {
        vi.useFakeTimers();
        spawnMock = vi.mocked(childProcess.spawn);
        spawnMock.mockReset();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        consoleSpy.mockRestore();
    });

    it('redacts api key values in the logged command string', async () => {
        spawnMock.mockReturnValue(makeFakeProcess(0));
        const service = new OpenClawService();
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, { ...BASE_PAYLOAD, aiApiKey: 'sk-supersecretkey12345' });
        await vi.runAllTimersAsync();
        await deployPromise;

        const logCalls = consoleSpy.mock.calls.flat().join(' ');
        expect(logCalls).not.toContain('sk-supersecretkey12345');
        expect(logCalls).toContain('<REDACTED>');
    });
});
