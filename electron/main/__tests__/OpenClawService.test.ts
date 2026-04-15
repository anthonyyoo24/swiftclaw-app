import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { EventEmitter } from 'events';
import type { IpcMainEvent } from 'electron';
import type { DeploymentPayload } from '../../../src/types/ai';
import { stripAnsi } from '../OpenClawService';

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
        promises: {
            writeFile: vi.fn().mockResolvedValue(undefined),
            copyFile: vi.fn().mockResolvedValue(undefined),
            unlink: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

import * as childProcess from 'child_process';
import fs from 'fs';
import { OpenClawService } from '../OpenClawService';

// ── Helpers ──────────────────────────────────────────────────────────────────

type MockedFsPromises = Record<'writeFile' | 'copyFile' | 'unlink', MockInstance>;
type MockedFs = Record<string, MockInstance> & { promises: MockedFsPromises };

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
    convexUrl: 'https://test-deployment.convex.cloud',
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

        // Six spawn calls: onboard + plugins disable + grammy install + channels add + agents add maya + cron add maya
        expect(spawnMock).toHaveBeenCalledTimes(6);
        const [cmd, args] = spawnMock.mock.calls[0];

        // Uses local binary, not npx
        expect(cmd).not.toMatch(/^npx/);
        expect(cmd).toMatch(/openclaw/);
        expect(args).toContain('onboard');
        expect(args).toContain('--non-interactive');
        expect(args).toContain('--accept-risk');
        expect(args).toContain('--auth-choice');
        expect(args).toContain('openai-api-key');
        expect(args).toContain('--openai-api-key');
        expect(args).toContain(BASE_PAYLOAD.aiApiKey);
        expect(args).toContain('--install-daemon');
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

    it('passes --workspace pointing to workspace-sarah to the onboard command', async () => {
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        const event = makeMockEvent();
        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const [, onboardArgs] = spawnMock.mock.calls[0];
        expect(onboardArgs).toContain('--workspace');
        const wsIndex = (onboardArgs as string[]).indexOf('--workspace');
        expect((onboardArgs as string[])[wsIndex + 1]).toMatch(/workspace-sarah$/);
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
            .mockReturnValueOnce(makeFakeProcess(0)) // plugins disable amazon-bedrock
            .mockReturnValueOnce(makeFakeProcess(0)) // grammy install
            .mockReturnValueOnce(makeFakeProcess(0)) // channels add
            .mockReturnValueOnce(makeFakeProcess(0)) // agents add maya
            .mockReturnValueOnce(makeFakeProcess(0)); // cron add maya-heartbeat
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'telegram', channelToken: 'tg-secret' });
        await vi.runAllTimersAsync();
        await p;

        expect(spawnMock).toHaveBeenCalledTimes(6);
        const [, args] = spawnMock.mock.calls[3];
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
            .mockReturnValueOnce(makeFakeProcess(0)) // plugins disable amazon-bedrock
            .mockReturnValueOnce(makeFakeProcess(0)) // grammy install
            .mockReturnValueOnce(makeFakeProcess(0)) // channels add
            .mockReturnValueOnce(makeFakeProcess(0)) // agents add maya
            .mockReturnValueOnce(makeFakeProcess(0)); // cron add maya-heartbeat
        const event = makeMockEvent();

        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'discord', channelToken: 'dc-secret' });
        await vi.runAllTimersAsync();
        await p;

        expect(spawnMock).toHaveBeenCalledTimes(6);
        const [, args] = spawnMock.mock.calls[3];
        expect(args).toContain('--channel');
        expect(args).toContain('discord');
        expect(args).toContain('--token');
        expect(args).toContain('dc-secret');
        expect(args).not.toContain('"dc-secret"');
    });

    it('emits deployment:error for an unsupported channel and does not reach gateway steps', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)) // plugins disable amazon-bedrock
            .mockReturnValueOnce(makeFakeProcess(0)); // grammy install
        const event = makeMockEvent();

        // Cast needed because TypeScript now rejects 'whatsapp' at the type level
        const p = service.deploy(event, { ...BASE_PAYLOAD, selectedChannel: 'whatsapp' as never, channelToken: '' });
        await vi.runAllTimersAsync();
        await p;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        expect(replies.find(([ch]) => ch === 'deployment:error')).toBeDefined();
        expect(replies.find(([ch]) => ch === 'deployment:success')).toBeUndefined();
        // Step 1.5 ran (onboard + plugins disable + grammy install); channels add was never reached
        expect(spawnMock).toHaveBeenCalledTimes(3);
    });

    it('emits deployment:progress step 2 before step 3', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)) // plugins disable amazon-bedrock
            .mockReturnValueOnce(makeFakeProcess(0)) // grammy install
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
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)) // plugins disable amazon-bedrock
            .mockReturnValueOnce(makeFakeProcess(0)) // grammy install
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
    const fsMock = () => fs as unknown as MockedFs;
    const fsPromisesMock = () => fsMock().promises;

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
        for (const method of ['writeFile', 'copyFile', 'unlink'] as const) {
            fsPromisesMock()[method].mockClear();
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

    it('total spawn count = 3 (onboard + plugins disable + grammy) + 1 (channels add) + N agents', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        // onboard(1) + plugins disable(1) + grammy install(1) + channels add(1) + agents add maya+jack(2) + cron add maya+jack(2) = 8
        expect(spawnMock).toHaveBeenCalledTimes(8);
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

        const userMdCall = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
            .find(([filePath]) => filePath.includes('workspace-maya') && filePath.endsWith('USER.md'));
        expect(userMdCall).toBeDefined();
    });

    it('writes USER.md to each workspace with correct userName, timezone, goals, and bulleted workflows', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const userMdCall = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
            .find(([filePath]) => filePath.includes('workspace-maya') && filePath.endsWith('USER.md'));

        expect(userMdCall).toBeDefined();
        const content = userMdCall![1];
        expect(content).toContain(BASE_PAYLOAD.userName);
        expect(content).toContain(BASE_PAYLOAD.timezone);
        expect(content).toContain(BASE_PAYLOAD.goals);
        expect(content).toContain('- write-code');
        expect(content).toContain('- review-prs');
    });

    it('strips __CUSTOM__: prefix from custom workflows when writing USER.md', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, { ...BASE_PAYLOAD, workflows: ['write-code', '__CUSTOM__:automate deployments'] });
        await vi.runAllTimersAsync();
        await p;

        const userMdCall = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
            .find(([filePath]) => filePath.includes('workspace-maya') && filePath.endsWith('USER.md'));

        expect(userMdCall).toBeDefined();
        const content = userMdCall![1];
        expect(content).toContain('- automate deployments');
        expect(content).not.toContain('__CUSTOM__:');
    });

    it('does not include usageType in USER.md content', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const userMdCall = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
            .find(([filePath]) => filePath.includes('workspace-maya') && filePath.endsWith('USER.md'));

        expect(userMdCall).toBeDefined();
        const content = userMdCall![1];
        expect(content).not.toContain('usageType');
        expect(content).not.toContain('usage type');
    });

    it('writes a unique AGENTS.md into each agent workspace', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const agentsMdCalls = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
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

        const agentsMdCalls = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
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

        const withToolsCalls = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
            .filter(([fp]) => fp.endsWith('AGENTS.md'));
        expect(withToolsCalls[0][1]).toContain('## Selected Tools');
        expect(withToolsCalls[0][1]).toContain('- github');

        fsPromisesMock().writeFile.mockClear();

        const event2 = makeMockEvent();
        const p2 = service.deploy(event2, { ...BASE_PAYLOAD, tools: [] });
        await vi.runAllTimersAsync();
        await p2;

        const withoutToolsCalls = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
            .filter(([fp]) => fp.endsWith('AGENTS.md'));
        expect(withoutToolsCalls[0][1]).not.toContain('## Selected Tools');
    });

    it('copies the correct SOUL.md template to each agent workspace', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const copyCalls = fsPromisesMock().copyFile.mock.calls as [string, string][];
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

        const userMdCalls = (fsPromisesMock().writeFile.mock.calls as [string, string, string][])
            .filter(([filePath]) => filePath.endsWith('USER.md'));
        expect(userMdCalls).toHaveLength(2);

        expect(userMdCalls[0][0]).toContain('workspace-maya');
        expect(userMdCalls[1][0]).toContain('workspace-jack');
        expect(userMdCalls[0][1]).toBe(userMdCalls[1][1]);
    });

    it('removes BOOTSTRAP.md from each agent workspace after seeding', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, TWO_AGENT_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const unlinkCalls = (fsPromisesMock().unlink.mock.calls as [string][])
            .filter(([p]) => (p as string).endsWith('BOOTSTRAP.md'));
        expect(unlinkCalls).toHaveLength(2);
        expect(unlinkCalls[0][0]).toContain('workspace-maya');
        expect(unlinkCalls[1][0]).toContain('workspace-jack');
    });

    it('emits deployment:error and stops if agents add exits non-zero', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)) // plugins disable amazon-bedrock
            .mockReturnValueOnce(makeFakeProcess(0)) // grammy install
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

// ── Step 1.5: Plugin dependency repair ───────────────────────────────────────

describe('Step 1.5 — plugin dependency repair', () => {
    let spawnMock: MockInstance;
    let service: OpenClawService;
    const fsMock = () => fs as unknown as MockedFs;

    beforeEach(() => {
        vi.useFakeTimers();
        spawnMock = vi.mocked(childProcess.spawn);
        spawnMock.mockReset();
        service = new OpenClawService();
        fsMock().existsSync.mockReturnValue(false);
    });

    afterEach(() => {
        vi.useRealTimers();
        fsMock().existsSync.mockReturnValue(false);
    });

    it('continues deploy even if plugins disable amazon-bedrock exits non-zero', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(1)) // plugins disable fails (non-fatal)
            .mockReturnValueOnce(makeFakeProcess(0)) // grammy install
            .mockReturnValueOnce(makeFakeProcess(0)) // channels add
            .mockReturnValueOnce(makeFakeProcess(0)); // agents add maya
        const event = makeMockEvent();

        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        expect(replies.find(([ch]) => ch === 'deployment:success')).toBeDefined();
        expect(replies.find(([ch]) => ch === 'deployment:error')).toBeUndefined();
    });

    it('emits deployment:error and stops if grammy install exits non-zero', async () => {
        spawnMock
            .mockReturnValueOnce(makeFakeProcess(0)) // onboard
            .mockReturnValueOnce(makeFakeProcess(0)) // plugins disable
            .mockReturnValueOnce(makeFakeProcess(1)); // grammy install fails
        const event = makeMockEvent();

        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        const replies = (event.reply as ReturnType<typeof vi.fn>).mock.calls;
        expect(replies.find(([ch]) => ch === 'deployment:error')).toBeDefined();
        expect(replies.find(([ch]) => ch === 'deployment:success')).toBeUndefined();
        // channels add and later steps should never be reached
        expect(spawnMock).toHaveBeenCalledTimes(3);
    });

    it('skips grammy install spawn when grammy directory already exists', async () => {
        // Return true only for the grammy subdirectory to simulate it being installed
        fsMock().existsSync.mockImplementation((p: unknown) =>
            typeof p === 'string' && p.endsWith('grammy')
        );
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        const event = makeMockEvent();

        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        // onboard + plugins disable + channels add + agents add + cron add = 5 (no grammy install spawn)
        expect(spawnMock).toHaveBeenCalledTimes(5);
        const cmdArgs = spawnMock.mock.calls.map(([, args]) => (args as string[]).join(' '));
        expect(cmdArgs.some(a => a.includes('grammy'))).toBe(false);
    });

    it('calls npm install with grammy and the correct flags', async () => {
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        const event = makeMockEvent();

        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        // grammy install is the 3rd spawn call (index 2): onboard[0], plugins disable[1], grammy[2]
        const [cmd, args] = spawnMock.mock.calls[2];
        expect(cmd).toMatch(/^npm/);
        expect(args).toContain('install');
        expect(args).toContain('grammy');
        expect(args).toContain('--no-save');
        expect(args).toContain('--prefix');
    });

    it('calls plugins disable with amazon-bedrock via local binary', async () => {
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        const event = makeMockEvent();

        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        // plugins disable is the 2nd spawn call (index 1); local binary, no npx/openclaw@latest prefix
        const [cmd, args] = spawnMock.mock.calls[1];
        expect(cmd).toMatch(/openclaw/);
        expect(cmd).not.toMatch(/^npx/);
        expect(args).not.toContain('openclaw@latest');
        expect(args).toContain('plugins');
        expect(args).toContain('disable');
        expect(args).toContain('amazon-bedrock');
    });
});

// ── buildCliEnv — NODE_PATH injection ────────────────────────────────────────

describe('buildCliEnv — NODE_PATH injection', () => {
    let spawnMock: MockInstance;
    let service: OpenClawService;
    const fsMock = () => fs as unknown as MockedFs;

    beforeEach(() => {
        vi.useFakeTimers();
        spawnMock = vi.mocked(childProcess.spawn);
        spawnMock.mockReset();
        spawnMock.mockImplementation(() => makeFakeProcess(0));
        service = new OpenClawService();
        fsMock().existsSync.mockReturnValue(false);
    });

    afterEach(() => {
        vi.useRealTimers();
        fsMock().existsSync.mockReturnValue(false);
    });

    it('always includes plugin-deps/node_modules in NODE_PATH', async () => {
        const event = makeMockEvent();
        const p = service.deploy(event, BASE_PAYLOAD);
        await vi.runAllTimersAsync();
        await p;

        // onboard is calls[0] — inspect its env
        const [, , opts] = spawnMock.mock.calls[0];
        const env = (opts as { env: NodeJS.ProcessEnv }).env;
        expect(env).toHaveProperty('NODE_PATH');
        expect(env.NODE_PATH).toContain('plugin-deps');
    });
});

// ── stripAnsi ─────────────────────────────────────────────────────────────────

describe('stripAnsi', () => {
    it('returns plain strings unchanged', () => {
        expect(stripAnsi('hello world')).toBe('hello world');
        expect(stripAnsi('')).toBe('');
    });

    it('strips CSI color sequences', () => {
        expect(stripAnsi('\x1B[31mred text\x1B[0m')).toBe('red text');
        expect(stripAnsi('\x1B[1;32mbold green\x1B[0m')).toBe('bold green');
    });

    it('strips CSI cursor movement sequences', () => {
        expect(stripAnsi('\x1B[2J\x1B[H')).toBe('');          // clear screen + move home
        expect(stripAnsi('line\x1B[2Krest')).toBe('linerest'); // erase line
    });

    it('strips OSC sequences (window title, progress)', () => {
        expect(stripAnsi('\x1B]0;My Terminal\x07')).toBe('');
        expect(stripAnsi('\x1B]9;4;1;50\x07progress')).toBe('progress');
        expect(stripAnsi('\x1B]0;title\x1B\\')).toBe('');      // ST terminator variant
    });

    it('strips two-byte escape sequences (0x40–0x5F range)', () => {
        expect(stripAnsi('\x1BM')).toBe('');   // reverse index (0x4D)
        expect(stripAnsi('\x1B@')).toBe('');   // ICH (0x40, range start)
        expect(stripAnsi('\x1B_')).toBe('');   // APC (0x5F, range end)
    });

    it('strips mixed sequences while preserving content', () => {
        const input = '\x1B[32m✓\x1B[0m Deployment \x1B[1mcomplete\x1B[0m';
        expect(stripAnsi(input)).toBe('✓ Deployment complete');
    });

    it('handles multiple sequences in CLI progress output', () => {
        const input = '\x1B[2K\x1B[1G\x1B[34mStep 3/8\x1B[0m: Installing deps';
        expect(stripAnsi(input)).toBe('Step 3/8: Installing deps');
    });

    it('strips bracketed-paste markers that expect injects around pasted tokens', () => {
        expect(stripAnsi('\x1b[?2004hsk-ant-oat01-abc123\x1b[?2004l')).toBe('sk-ant-oat01-abc123');
    });
});

// ── isPastingToken flag ───────────────────────────────────────────────────────

describe('OpenClawService — isPastingToken flag', () => {
    type ServicePrivate = {
        isPastingToken: boolean;
        wasCancelled: boolean;
        resetState: () => void;
    };

    it('starts as false', () => {
        const svc = new OpenClawService();
        expect((svc as unknown as ServicePrivate).isPastingToken).toBe(false);
    });

    it('resetState clears isPastingToken when true', () => {
        const svc = new OpenClawService();
        (svc as unknown as ServicePrivate).isPastingToken = true;
        (svc as unknown as ServicePrivate).resetState();
        expect((svc as unknown as ServicePrivate).isPastingToken).toBe(false);
    });
});

// ── Stage 2 stdout/stderr suppression ────────────────────────────────────────

describe('Stage 2 data handler suppression', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not log when isPastingToken is true — handles split data events', () => {
        let isPastingToken = true;
        const handler = (data: Buffer) => {
            if (isPastingToken) return;
            const line = stripAnsi(data.toString()).trim();
            if (line) console.log(`[OAuth/Anthropic Stage2]: ${line}`);
        };

        const token = 'sk-ant-oat01-' + 'A'.repeat(60);
        // Simulate token split across two data events
        handler(Buffer.from(token.slice(0, 40)));
        handler(Buffer.from(token.slice(40)));
        // Simulate ANSI-wrapped token
        handler(Buffer.from(`\x1b[32m${token}\x1b[0m`));

        expect(consoleSpy).not.toHaveBeenCalled();

        // After flag clears, non-sensitive output logs normally
        isPastingToken = false;
        handler(Buffer.from('Authentication complete'));
        expect(consoleSpy).toHaveBeenCalledWith('[OAuth/Anthropic Stage2]: Authentication complete');
    });

    it('does not log stderr when isPastingToken is true', () => {
        let isPastingToken = true;
        const handler = (data: Buffer) => {
            if (isPastingToken) return;
            const line = stripAnsi(data.toString()).trim();
            if (line) console.error(`[OAuth/Anthropic Stage2 stderr]: ${line}`);
        };

        handler(Buffer.from('sk-ant-oat01-' + 'B'.repeat(60)));
        expect(consoleErrSpy).not.toHaveBeenCalled();

        isPastingToken = false;
        handler(Buffer.from('some stderr output'));
        expect(consoleErrSpy).toHaveBeenCalledWith('[OAuth/Anthropic Stage2 stderr]: some stderr output');
    });

    it('old includes() guard fails when ANSI codes are interspersed within the token', () => {
        // Demonstrates the root vulnerability: ANSI reset codes mid-token prevent
        // includes(capturedToken) from matching, so the fragment would be logged.
        const token = 'sk-ant-oat01-' + 'C'.repeat(60);
        const half = Math.floor(token.length / 2);
        const interspersed = token.slice(0, half) + '\x1b[0m' + token.slice(half);

        // Old guard fails — full token not found due to embedded ANSI
        expect(interspersed.includes(token)).toBe(false);
        // stripAnsi reconstructs the bare token correctly
        expect(stripAnsi(interspersed)).toBe(token);
    });
});
