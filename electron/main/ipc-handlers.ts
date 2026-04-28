import { ipcMain, app } from 'electron';
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import fs from 'fs';
import { OpenClawService } from './OpenClawService';
import { IPC_EVENTS } from '../../src/constants/ipc';
import { DeploymentPayload } from '../../src/types/ai';
import { getOpenClawConfigPath, resolveOpenClawBinary } from './openclaw-helpers';

let gatewayRunProc: ChildProcess | null = null;

const devLog = (...args: unknown[]) => { if (!app.isPackaged) console.log(...args); };

function startGatewayDaemon(): void {
    const binary = resolveOpenClawBinary();

    // Try the installed system service first (launchd/systemd).
    // If not installed (non-zero exit), fall back to running the gateway
    // in the foreground — managed by this Electron process.
    const startProc = spawn(binary, ['gateway', 'start'], {
        stdio: 'ignore',
        detached: true,
    });
    startProc.unref();

    startProc.on('error', (err) => {
        console.warn('[gateway] service start error:', err.message);
        runGatewayForeground(binary);
    });

    startProc.on('close', (code) => {
        if (code === 0) {
            devLog('[gateway] service started');
        } else {
            console.warn(`[gateway] service start failed (code ${code}), running in foreground`);
            runGatewayForeground(binary);
        }
    });
}

function runGatewayForeground(binary: string): void {
    if (gatewayRunProc) return; // already running

    gatewayRunProc = spawn(binary, ['gateway', 'run', '--allow-unconfigured'], {
        stdio: 'ignore',
    });

    gatewayRunProc.on('error', (err) => {
        console.warn('[gateway] run error:', err.message);
        gatewayRunProc = null;
    });

    gatewayRunProc.on('close', (code) => {
        devLog(`[gateway] run exited with code ${code}`);
        gatewayRunProc = null;
    });

    app.on('will-quit', () => {
        if (gatewayRunProc) {
            gatewayRunProc.kill();
            gatewayRunProc = null;
        }
    });
}

/**
 * Redacts sensitive fields from the deployment payload for safe logging.
 */
const sanitizeDeploymentPayload = (payload: DeploymentPayload): DeploymentPayload => {
    return {
        ...payload,
        aiApiKey: payload.aiApiKey ? '***REDACTED***' : '',
        channelToken: payload.channelToken ? '***REDACTED***' : '',
    };
};

export function setupIpcHandlers() {
    startGatewayDaemon();

    // Stop the gateway service when the app quits, regardless of how it was started.
    // spawnSync ensures the command completes before Electron exits.
    app.on('will-quit', () => {
        const binary = resolveOpenClawBinary();
        devLog('[gateway] stopping on app quit...');
        spawnSync(binary, ['gateway', 'stop'], { stdio: 'ignore' });
        devLog('[gateway] stopped');
    });

    const service = new OpenClawService();

    ipcMain.on(IPC_EVENTS.AUTH_OAUTH_START, async (event, payload: { provider: string }) => {
        console.log('Received auth:oauth:start with payload:', payload);
        await service.authenticate(event, payload.provider);
    });

    ipcMain.on(IPC_EVENTS.AUTH_OAUTH_CANCEL, () => {
        console.log('Received auth:oauth:cancel – triggering cleanup in service');
        service.cancel();
    });

    ipcMain.on(IPC_EVENTS.DEPLOYMENT_START, async (event, payload: DeploymentPayload) => {
        const safePayload = sanitizeDeploymentPayload(payload);
        console.log('Received deployment:start with payload:', safePayload);
        await service.deploy(event, payload);
    });

    ipcMain.handle(IPC_EVENTS.AGENT_PAUSE, (_event, { agentName }: { agentName: string }) => {
        return service.pauseAgent(agentName);
    });

    ipcMain.handle(IPC_EVENTS.AGENT_RESUME, (_event, { agentName }: { agentName: string }) => {
        return service.resumeAgent(agentName);
    });

    ipcMain.handle(IPC_EVENTS.OPENCLAW_RESET, () => {
        return service.resetOpenClaw();
    });

    ipcMain.handle(IPC_EVENTS.GATEWAY_GET_PORT, () => {
        const configPath = getOpenClawConfigPath();
        if (!fs.existsSync(configPath)) {
            devLog('[gateway] config not found, using default port 18789');
            return 18789;
        }
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            const port = (config as Record<string, Record<string, unknown>>)?.gateway?.port ?? 18789;
            devLog(`[gateway] port resolved: ${port}`);
            return port;
        } catch {
            console.warn('[gateway] failed to parse config, using default port 18789');
            return 18789;
        }
    });

    ipcMain.handle(IPC_EVENTS.GATEWAY_GET_AUTH, (): { token?: string; password?: string } => {
        const configPath = getOpenClawConfigPath();
        if (!fs.existsSync(configPath)) {
            devLog('[gateway] config not found, connecting without auth');
            return {};
        }
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
            const auth = ((config.gateway as Record<string, unknown>)?.auth) as Record<string, unknown> | undefined;
            if (!auth) {
                devLog('[gateway] no auth config found, connecting without auth');
                return {};
            }
            const token = resolveSecret(auth.token);
            const password = resolveSecret(auth.password);
            if (token) devLog('[gateway] auth: token found');
            else if (password) devLog('[gateway] auth: password found');
            else console.warn('[gateway] auth config present but no token or password resolved');
            return { token, password };
        } catch {
            console.warn('[gateway] failed to parse auth config');
            return {};
        }
    });
}

/** Resolves a SecretInput: plain string or "env:VAR_NAME" reference. */
function resolveSecret(value: unknown): string | undefined {
    if (typeof value !== 'string' || !value) return undefined;
    if (value.startsWith('env:')) return process.env[value.slice(4)] ?? undefined;
    return value;
}
