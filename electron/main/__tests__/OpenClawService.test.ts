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

    // Emit close via setTimeout so vi.runAllTimersAsync() controls when it fires.
    // This ensures listeners are always attached before close fires, even when
    // the process is created before deploy() is called (mockReturnValueOnce).
    setTimeout(() => proc.emit('close', exitCode), 0);

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
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await deployPromise;

        // Two spawn calls: onboard (call[0]) + channels add (call[1])
        expect(spawnMock).toHaveBeenCalledTimes(2);
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
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await deployPromise;

        const firstReply = (event.reply as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(firstReply[0]).toBe('deployment:progress');
        expect(firstReply[1]).toMatchObject({ step: 1 });
    });

    it('emits deployment:success after a successful run', async () => {
        spawnMock.mockImplementation(() => makeFakeProcess(0));
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
        spawnMock.mockImplementation(() => makeFakeProcess(1));
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
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        const service = new OpenClawService();
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, { ...BASE_PAYLOAD, aiApiKey: 'sk-supersecretkey12345' });
        await vi.runAllTimersAsync();
        await deployPromise;

        const logCalls = consoleSpy.mock.calls.flat().join(' ');
        expect(logCalls).not.toContain('sk-supersecretkey12345');
        expect(logCalls).toContain('<REDACTED>');
    });

    it('redacts channelToken in the logged channels add command', async () => {
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        const service = new OpenClawService();
        const event = makeMockEvent();

        const deployPromise = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'telegram', channelToken: 'tg-super-secret' });
        await vi.runAllTimersAsync();
        await deployPromise;

        const logCalls = consoleSpy.mock.calls.flat().join(' ');
        expect(logCalls).not.toContain('tg-super-secret');
        expect(logCalls).toContain('<REDACTED>');
    });
});

// ── Phase 3: Channel Configuration ───────────────────────────────────────────

describe('Phase 3 – channel configuration', () => {
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

    it('calls channels add for telegram with the correct flags', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)); // channels add
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'telegram', channelToken: 'tg-secret' });
        await vi.runAllTimersAsync();
        await p;

        expect(spawnMock).toHaveBeenCalledTimes(2);
        const [, args] = spawnMock.mock.calls[1];
        expect(args).toContain('channels');
        expect(args).toContain('add');
        expect(args).toContain('--channel');
        expect(args).toContain('telegram');
        expect(args).toContain('--token');
        expect(args).toContain('tg-secret');
    });

    it('calls channels add for discord with the correct flags', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)); // channels add
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'discord', channelToken: 'dc-secret' });
        await vi.runAllTimersAsync();
        await p;

        expect(spawnMock).toHaveBeenCalledTimes(2);
        const [, args] = spawnMock.mock.calls[1];
        expect(args).toContain('--channel');
        expect(args).toContain('discord');
        expect(args).toContain('--token');
        expect(args).toContain('dc-secret');
        expect(args).not.toContain('"dc-secret"');
    });

    it('does NOT call channels add for whatsapp', async () => {
        spawnMock.mockReturnValueOnce(makeFakeProcess(0)); // onboard only
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'whatsapp', channelToken: '' });
        await vi.runAllTimersAsync();
        await p;

        expect(spawnMock).toHaveBeenCalledTimes(1);
        const [, args] = spawnMock.mock.calls[0];
        expect(args).not.toContain('channels');
    });

    it('emits deployment:progress step 2 before step 3', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0))
            .mockReturnValueOnce(makeFakeProcess(0));
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'telegram' });
        await vi.runAllTimersAsync();
        await p;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        const step2 = replies.find(([ch, data]) => ch === 'deployment:progress' && data.step === 2);
        const step3 = replies.find(([ch, data]) => ch === 'deployment:progress' && data.step === 3);
        expect(step2).toBeDefined();
        expect(step3).toBeDefined();
        expect(replies.indexOf(step3!)).toBeGreaterThan(replies.indexOf(step2!));
    });

    it('emits deployment:error and stops if channels add exits non-zero', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard succeeds
            .mockReturnValueOnce(makeFakeProcess(1)); // channels add fails
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'telegram' });
        await vi.runAllTimersAsync();
        await p;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        expect(replies.find(([ch]) => ch === 'deployment:error')).toBeDefined();
        expect(replies.find(([ch]) => ch === 'deployment:success')).toBeUndefined();
    });
});
