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
    app: { isPackaged: false },
}));

// ── Mock fs so we don't touch the real filesystem ───────────────────────────
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(() => false),
        statSync: vi.fn(() => ({ mtimeMs: 0 })),
        readFileSync: vi.fn((filePath: unknown) => {
            if (typeof filePath === 'string' && filePath.endsWith('sarah.md')) {
                return 'You are Sarah. Delegation coordinator.';
            }
            if (typeof filePath === 'string' && filePath.endsWith('default.md')) {
                return 'You are an agent at the user\'s company.';
            }
            return '{}';
        }),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
        copyFileSync: vi.fn(),
        symlinkSync: vi.fn(),
        unlinkSync: vi.fn(),
    },
}));

import * as childProcess from 'child_process';
import fs from 'fs';
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
    userName: 'Test User',
    timezone: 'America/New_York',
    usageType: 'business',
    businessDescription: 'A test business',
    goals: 'Build amazing software',
    workflows: ['write-code', 'review-prs'],
    tools: ['github', 'slack'],
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

        // Three spawn calls: onboard (call[0]) + channels add (call[1]) + agents add maya (call[2])
        expect(spawnMock).toHaveBeenCalledTimes(3);
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
            .mockReturnValueOnce(makeFakeProcess(0)) // channels add
            .mockReturnValueOnce(makeFakeProcess(0)); // agents add maya
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'telegram', channelToken: 'tg-secret' });
        await vi.runAllTimersAsync();
        await p;

        expect(spawnMock).toHaveBeenCalledTimes(3);
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
            .mockReturnValueOnce(makeFakeProcess(0)) // channels add
            .mockReturnValueOnce(makeFakeProcess(0)); // agents add maya
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'discord', channelToken: 'dc-secret' });
        await vi.runAllTimersAsync();
        await p;

        expect(spawnMock).toHaveBeenCalledTimes(3);
        const [, args] = spawnMock.mock.calls[1];
        expect(args).toContain('--channel');
        expect(args).toContain('discord');
        expect(args).toContain('--token');
        expect(args).toContain('dc-secret');
        expect(args).not.toContain('"dc-secret"');
    });

    it('does NOT call channels add for whatsapp', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)); // agents add maya (no channels add)
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'whatsapp', channelToken: '' });
        await vi.runAllTimersAsync();
        await p;

        expect(spawnMock).toHaveBeenCalledTimes(2);
        // Verify neither spawn call used the 'channels' subcommand
        for (const [, callArgs] of spawnMock.mock.calls) {
            expect(callArgs).not.toContain('channels');
        }
    });

    it('emits deployment:progress step 2 before step 3', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)) // channels add
            .mockReturnValueOnce(makeFakeProcess(0)); // agents add maya
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

// ── Phase 4–6: Agent workspace initialization ─────────────────────────────────

describe('Phase 4–6 — agent workspace initialization', () => {
    let spawnMock: MockInstance;
    let service: OpenClawService;
    // Convenience: cast the mocked fs default export
    const fsMock = () => fs as unknown as Record<string, MockInstance>;

    const TWO_AGENT_PAYLOAD: DeploymentPayload = {
        ...BASE_PAYLOAD,
        agentTemplateIds: ['maya', 'jack'],
    };

    beforeEach(() => {
        vi.useFakeTimers();
        spawnMock = vi.mocked(childProcess.spawn);
        spawnMock.mockReset();
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        service = new OpenClawService();
        // Clear fs call history before each test
        for (const method of ['writeFileSync', 'mkdirSync', 'copyFileSync', 'symlinkSync', 'unlinkSync']) {
            fsMock()[method].mockClear();
        }
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls openclaw agents add for each agentTemplateId with --workspace and --non-interactive', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const agentsCalls = spawnMock.mock.calls.filter(([, args]) =>
            args.includes('agents') && args.includes('add')
        );
        expect(agentsCalls).toHaveLength(2);

        const [, mayaArgs] = agentsCalls[0];
        expect(mayaArgs).toContain('maya');
        expect(mayaArgs).toContain('--workspace');
        expect(mayaArgs).toContain('--non-interactive');
        expect((mayaArgs as string[]).join('/')).toContain('workspace-maya');

        const [, jackArgs] = agentsCalls[1];
        expect(jackArgs).toContain('jack');
        expect((jackArgs as string[]).join('/')).toContain('workspace-jack');
    });

    it('total spawn count = 2 (onboard + channels add) + N agents', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        // onboard(1) + channels add telegram(1) + agents add maya + jack(2) = 4
        expect(spawnMock).toHaveBeenCalledTimes(4);
    });

    it('writes USER.md directly into each agent workspace (no shared dir)', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        expect(fsMock().mkdirSync).not.toHaveBeenCalledWith(
            expect.stringContaining('shared'),
            expect.anything()
        );

        const userMdCall = (fsMock().writeFileSync.mock.calls as [string, string, string][])
            .find(([filePath]) => filePath.includes('workspace-maya') && filePath.endsWith('USER.md'));
        expect(userMdCall).toBeDefined();
    });

    it('writes USER.md to each workspace with correct userName, timezone, goals, and bulleted workflows', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const userMdCall = (fsMock().writeFileSync.mock.calls as [string, string, string][])
            .find(([filePath]) => filePath.includes('workspace-maya') && filePath.endsWith('USER.md'));

        expect(userMdCall).toBeDefined();
        const content = userMdCall![1];
        expect(content).toContain(BASE_PAYLOAD.userName);
        expect(content).toContain(BASE_PAYLOAD.timezone);
        expect(content).toContain(BASE_PAYLOAD.goals);
        expect(content).toContain('- write-code');
        expect(content).toContain('- review-prs');
    });

    it('writes a unique AGENTS.md into each agent workspace', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const agentsMdCalls = (fsMock().writeFileSync.mock.calls as [string, string, string][])
            .filter(([filePath]) => filePath.endsWith('AGENTS.md'));

        expect(agentsMdCalls).toHaveLength(2);
        expect(agentsMdCalls[0][0]).toContain('workspace-maya');
        expect(agentsMdCalls[1][0]).toContain('workspace-jack');
    });

    it('sarah gets coordinator AGENTS.md template; other agents get the generic template', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, { ...BASE_PAYLOAD, agentTemplateIds: ['sarah', 'maya'] });
        await vi.runAllTimersAsync();
        await p;

        const agentsMdCalls = (fsMock().writeFileSync.mock.calls as [string, string, string][])
            .filter(([filePath]) => filePath.endsWith('AGENTS.md'));

        const sarahContent = agentsMdCalls.find(([p]) => p.includes('workspace-sarah'))?.[1];
        const mayaContent  = agentsMdCalls.find(([p]) => p.includes('workspace-maya'))?.[1];

        expect(sarahContent).toContain('You are Sarah');
        expect(mayaContent).not.toContain('You are Sarah');
        expect(mayaContent).toContain('You are an agent');
    });

    it('appends Selected Tools section when tools provided; omits it when empty', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, { ...BASE_PAYLOAD, tools: ['github', 'slack'] });
        await vi.runAllTimersAsync();
        await p;

        const withToolsCalls = (fsMock().writeFileSync.mock.calls as [string, string, string][])
            .filter(([fp]) => fp.endsWith('AGENTS.md'));
        expect(withToolsCalls[0][1]).toContain('## Selected Tools');
        expect(withToolsCalls[0][1]).toContain('- github');

        fsMock().writeFileSync.mockClear();

        const event2 = makeMockEvent();
        const p2 = service.deploy(event2, { ...BASE_PAYLOAD, tools: [] });
        await vi.runAllTimersAsync();
        await p2;

        const withoutToolsCalls = (fsMock().writeFileSync.mock.calls as [string, string, string][])
            .filter(([fp]) => fp.endsWith('AGENTS.md'));
        expect(withoutToolsCalls[0][1]).not.toContain('## Selected Tools');
    });

    it('copies the correct SOUL.md template to each agent workspace', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const copyCalls = fsMock().copyFileSync.mock.calls as [string, string][];
        expect(copyCalls).toHaveLength(2);

        const [mayaSrc, mayaDest] = copyCalls[0];
        expect(mayaSrc).toContain('maya_support.md');
        expect(mayaDest).toContain('workspace-maya');
        expect(mayaDest).toContain('SOUL.md');

        const [jackSrc, jackDest] = copyCalls[1];
        expect(jackSrc).toContain('jack_sales.md');
        expect(jackDest).toContain('workspace-jack');
    });

    it('writes a real USER.md into each agent workspace with identical content (no symlinks)', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        expect(fsMock().symlinkSync).not.toHaveBeenCalled();

        const userMdCalls = (fsMock().writeFileSync.mock.calls as [string, string, string][])
            .filter(([filePath]) => filePath.endsWith('USER.md'));
        expect(userMdCalls).toHaveLength(2);

        expect(userMdCalls[0][0]).toContain('workspace-maya');
        expect(userMdCalls[1][0]).toContain('workspace-jack');
        expect(userMdCalls[0][1]).toBe(userMdCalls[1][1]);
    });

    it('removes BOOTSTRAP.md from each agent workspace after seeding', async () => {
        fsMock().existsSync.mockImplementation((p: string) =>
            (p as string).endsWith('BOOTSTRAP.md')
        );
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const unlinkCalls = (fsMock().unlinkSync.mock.calls as [string][])
            .filter(([p]) => (p as string).endsWith('BOOTSTRAP.md'));
        expect(unlinkCalls).toHaveLength(2);
        expect(unlinkCalls[0][0]).toContain('workspace-maya');
        expect(unlinkCalls[1][0]).toContain('workspace-jack');
    });

    it('emits deployment:error and stops if agents add exits non-zero', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)) // channels add
            .mockReturnValueOnce(makeFakeProcess(1)); // agents add maya fails
        const event = makeMockEvent();
        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        expect(replies.find(([ch]) => ch === 'deployment:error')).toBeDefined();
        expect(replies.find(([ch]) => ch === 'deployment:success')).toBeUndefined();
        // USER.md should NOT have been written — failed before step 4
        expect(fsMock().writeFileSync).not.toHaveBeenCalledWith(
            expect.stringContaining('shared'),
            expect.anything(),
            expect.anything()
        );
    });
});
