import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

vi.mock('electron', () => ({
    app: {
        isPackaged: false,
        getAppPath: vi.fn(() => '/mock/app'),
    },
}));

vi.mock('os', () => ({
    default: { homedir: vi.fn(() => '/home/testuser') },
}));

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
    },
}));

import { app } from 'electron';
import fs from 'fs';
import {
    getOpenClawHome,
    getOpenClawConfigPath,
    getOpenClawWorkspacePath,
    getOpenClawPluginDepsDir,
    resolveOpenClawBinary,
    getResourcesPath,
    updateOpenClawConfig,
} from '../openclaw-helpers';

beforeEach(() => {
    vi.clearAllMocks();
    (app as unknown as Record<string, unknown>).isPackaged = false;
});

// ── Path helpers ──────────────────────────────────────────────────────────────

describe('getOpenClawHome', () => {
    it('returns <homedir>/.openclaw', () => {
        expect(getOpenClawHome()).toBe(path.join('/home/testuser', '.openclaw'));
    });
});

describe('getOpenClawConfigPath', () => {
    it('returns the openclaw.json path inside the home dir', () => {
        expect(getOpenClawConfigPath()).toBe(path.join('/home/testuser', '.openclaw', 'openclaw.json'));
    });
});

describe('getOpenClawWorkspacePath', () => {
    it('returns workspace-<agentId> inside the home dir', () => {
        expect(getOpenClawWorkspacePath('sarah')).toBe(path.join('/home/testuser', '.openclaw', 'workspace-sarah'));
        expect(getOpenClawWorkspacePath('alex')).toBe(path.join('/home/testuser', '.openclaw', 'workspace-alex'));
    });
});

describe('getOpenClawPluginDepsDir', () => {
    it('returns plugin-deps inside the home dir', () => {
        expect(getOpenClawPluginDepsDir()).toBe(path.join('/home/testuser', '.openclaw', 'plugin-deps'));
    });
});

// ── resolveOpenClawBinary ─────────────────────────────────────────────────────

describe('resolveOpenClawBinary', () => {
    it('dev mode: does not call getAppPath, uses __dirname-relative path', () => {
        const result = resolveOpenClawBinary();
        expect(vi.mocked(app.getAppPath)).not.toHaveBeenCalled();
        expect(result).toContain(path.join('node_modules', '.bin', 'openclaw'));
    });

    it('packaged mode: calls getAppPath and builds path from it', () => {
        (app as unknown as Record<string, unknown>).isPackaged = true;
        const result = resolveOpenClawBinary();
        expect(vi.mocked(app.getAppPath)).toHaveBeenCalled();
        expect(result).toBe(path.join('/mock/app', 'node_modules', '.bin', 'openclaw'));
    });

    it('uses openclaw.cmd on Windows', () => {
        const original = process.platform;
        Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
        try {
            expect(resolveOpenClawBinary()).toMatch(/openclaw\.cmd$/);
        } finally {
            Object.defineProperty(process, 'platform', { value: original, configurable: true });
        }
    });
});

// ── getResourcesPath ──────────────────────────────────────────────────────────

describe('getResourcesPath', () => {
    it('dev mode: returns a path containing "resources"', () => {
        expect(getResourcesPath()).toContain('resources');
    });

    it('packaged mode: returns process.resourcesPath', () => {
        (app as unknown as Record<string, unknown>).isPackaged = true;
        expect(getResourcesPath()).toBe(process.resourcesPath);
    });
});

// ── updateOpenClawConfig ──────────────────────────────────────────────────────

describe('updateOpenClawConfig', () => {
    it('starts with {} when config file does not exist', () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        let received: Record<string, unknown> | undefined;
        updateOpenClawConfig((config) => { received = { ...config }; });

        expect(fs.readFileSync).not.toHaveBeenCalled();
        expect(received).toEqual({});
    });

    it('parses existing JSON and passes it to the updater', () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('{"agents":{"defaults":{}}}');

        let received: Record<string, unknown> | undefined;
        updateOpenClawConfig((config) => { received = config; });

        expect(received).toEqual({ agents: { defaults: {} } });
    });

    it('recovers to {} when the config file contains invalid JSON', () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('not valid json {{{{');

        let received: Record<string, unknown> | undefined;
        updateOpenClawConfig((config) => { received = { ...config }; });

        expect(received).toEqual({});
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('writes the mutated config back as pretty-printed JSON', () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        updateOpenClawConfig((config) => { config.foo = 'bar'; });

        expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalledWith(
            '/home/testuser/.openclaw/openclaw.json',
            JSON.stringify({ foo: 'bar' }, null, 2),
            'utf-8',
        );
    });

    it('writes even when the updater makes no changes', () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        updateOpenClawConfig(() => { /* no-op */ });

        expect(fs.writeFileSync).toHaveBeenCalledOnce();
    });
});
