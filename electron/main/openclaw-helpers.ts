import path from 'path';
import os from 'os';
import fs from 'fs';
import { app } from 'electron';

// ── Path helpers ──────────────────────────────────────────────────────────────

export function getOpenClawHome(): string {
    return path.join(os.homedir(), '.openclaw');
}

export function getOpenClawConfigPath(): string {
    return path.join(getOpenClawHome(), 'openclaw.json');
}

export function getOpenClawWorkspacePath(agentId: string): string {
    return path.join(getOpenClawHome(), `workspace-${agentId}`);
}

export function getOpenClawPluginDepsDir(): string {
    return path.join(getOpenClawHome(), 'plugin-deps');
}

/**
 * Resolves the path to the locally installed openclaw binary.
 * In production, electron-vite's externalizeDepsPlugin keeps node_modules intact
 * alongside the compiled main process, so the binary lives next to app.getAppPath().
 * In development, it lives in the project's node_modules/.bin/.
 */
export function resolveOpenClawBinary(): string {
    const binName = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw';
    if (app.isPackaged) {
        return path.join(app.getAppPath(), 'node_modules', '.bin', binName);
    }
    // __dirname is dist/main/ after electron-vite compilation; walk up to the package root
    return path.join(__dirname, '..', '..', 'node_modules', '.bin', binName);
}

/**
 * Returns the path to the bundled resources/ directory.
 * In production this is process.resourcesPath; in dev it is relative to __dirname.
 */
export function getResourcesPath(): string {
    if (app.isPackaged) return process.resourcesPath;
    return path.join(__dirname, '../../resources');
}

// ── Config helper ─────────────────────────────────────────────────────────────

/**
 * Reads ~/.openclaw/openclaw.json, applies the updater callback, then writes back.
 * Recovers gracefully from missing or unparseable config by starting from {}.
 */
export function updateOpenClawConfig(updater: (config: Record<string, unknown>) => void): void {
    const configPath = getOpenClawConfigPath();
    let config: Record<string, unknown> = {};
    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch { /* start fresh if unparseable */ }
    }
    updater(config);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
