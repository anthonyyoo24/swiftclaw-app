import { IpcMainEvent, app } from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';


import { DeploymentPayload } from '../../src/types/ai';
import { OAUTH_PROVIDER_MAP, SOUL_TEMPLATE_FILES } from '../../src/constants/ai-core';
import { IPC_EVENTS } from '../../src/constants/ipc';



// ── Template generators ───────────────────────────────────────────────────────

function generateUserMd(payload: {
    userName: string;
    timezone: string;
    usageType: string;
    businessDescription?: string;
    personalContext?: string;
    goals: string;
    workflows: string[];
}): string {
    const context = payload.usageType === 'business'
        ? (payload.businessDescription ?? '')
        : (payload.personalContext ?? '');
    const workflowList = payload.workflows.map(w => `- ${w}`).join('\n');

    return `# About ${payload.userName}

**Timezone:** ${payload.timezone}
**Usage:** ${payload.usageType}

## Context
${context}

## Goals
${payload.goals}

## Workflows
${workflowList}
`;
}


/** Flags whose immediately following argument contains a secret value. */
const SECRET_FLAGS = /^--(?:[\w-]*api[_-]?key|secret|token|password|auth[_-]?token)$/i;

/** Fallback: redact any standalone value that looks like a long random credential (≥20 alphanum chars). */
const SECRET_VALUE_PATTERN = /^[A-Za-z0-9_\-]{20,}$/;

export class OpenClawService {
    private cliProcess: ChildProcess | null = null;
    private wasCancelled = false;

    private resetState() {
        this.wasCancelled = false;
        if (this.cliProcess && !this.cliProcess.killed) {
            this.cliProcess.kill();
        }
        this.cliProcess = null;
    }

    private emitProgress(event: IpcMainEvent, step: number, label: string) {
        event.reply(IPC_EVENTS.DEPLOYMENT_PROGRESS, { step, label });
    }


    /**
     * Returns the path to the bundled resources/ directory.
     * In production this is process.resourcesPath; in dev it is relative to __dirname.
     */
    private getResourcesPath(): string {
        if (app.isPackaged) return process.resourcesPath;
        return path.join(__dirname, '../../resources');
    }

    /**
     * Reads the correct AGENTS.md template for the given agent from resources/agent-templates/,
     * then appends a Selected Tools section if tools were provided.
     */
    private generateAgentsMd(agentId: string, tools: string[]): string {
        const templateFile = agentId === 'sarah' ? 'sarah.md' : 'default.md';
        const templatePath = path.join(this.getResourcesPath(), 'agent-templates', templateFile);
        const base = fs.readFileSync(templatePath, 'utf-8');
        if (tools.length === 0) return base;
        const toolsList = tools.map(t => `- ${t}`).join('\n');
        return `${base}\n## Selected Tools\n${toolsList}\n`;
    }

    /**
     * Builds the environment for spawned CLI processes.
     */
    private buildCliEnv(): NodeJS.ProcessEnv {
        const env: NodeJS.ProcessEnv = { ...process.env };

        return env;
    }

    /**
     * Executes the OAuth authentication flow using the bundled OpenClaw CLI.
     */
    async authenticate(event: IpcMainEvent, provider: string) {
        if (this.cliProcess) {
            console.warn('[OpenClawService] Operation already in progress, ignoring.');
            event.reply(IPC_EVENTS.AUTH_OAUTH_COMPLETE, { success: false, error: 'An operation is already in progress.' });
            return;
        }
        this.resetState();
        const entry = OAUTH_PROVIDER_MAP[provider];

        if (!entry) {
            event.reply(IPC_EVENTS.AUTH_OAUTH_COMPLETE, {
                success: false,
                error: `Invalid OAuth provider: ${provider}`,
            });
            return;
        }

        // Anthropic uses a two-stage flow: run `claude setup-token` to open browser,
        // then pipe the captured token into OpenClaw.
        if (provider === 'anthropic-oauth') {
            return this.authenticateAnthropic(event);
        }

        try {
            console.log(`[OAuth] Starting native Expect-driven TTY flow for provider: ${entry.provider}`);

            const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
            let beforeMtime = 0;
            if (fs.existsSync(configPath)) {
                beforeMtime = fs.statSync(configPath).mtimeMs;
            }

            const envForCli = this.buildCliEnv();

            // Validate entry values against a strict allowlist before shell interpolation.
            // entry.provider/method come from a hardcoded map, but guard against future changes.
            const SAFE_ARG = /^[a-zA-Z0-9_-]+$/;
            if (!SAFE_ARG.test(entry.provider)) {
                throw new Error(`[OAuth] Unsafe provider value rejected: ${entry.provider}`);
            }
            if (entry.method && !SAFE_ARG.test(entry.method)) {
                throw new Error(`[OAuth] Unsafe method value rejected: ${entry.method}`);
            }

            let cliCommand = `npx -y openclaw@latest models auth login --provider ${entry.provider}`;
            if (entry.method) {
                cliCommand += ` --method ${entry.method}`;
            }

            // macOS / Linux: Route through 'expect' to simulate a TTY invisibly in the background.
            // This satisfies the `process.stdin.isTTY` check inside OpenClaw and auto-answers
            // any interactive confirmation prompts (Gemini caution, etc.) with "y".
            const expectScript = `
spawn -noecho bash -c "${cliCommand}"
set timeout 300
expect {
    -re "Continue with.*\\?" {
        send "y\\r"
        exp_continue
    }
    eof
}
catch wait result
exit [lindex $result 3]
`;

            this.cliProcess = spawn('expect', ['-c', expectScript], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: envForCli
            });

            this.cliProcess.stdout?.on('data', (data) => {
                const line = data.toString().trim();
                if (line && !line.includes('Complete sign-in in browser')) {
                    console.log(`[OAuth CLI]: ${line}`);
                }
            });
            this.cliProcess.stderr?.on('data', (data) => {
                const line = data.toString().trim();
                if (line && !line.includes('Complete sign-in in browser')) {
                    console.error(`[OAuth CLI stderr]: ${line}`);
                }
            });

            const exitCode = await new Promise<number>((resolve) => {
                this.cliProcess!.on('close', (code) => {
                    resolve(code ?? 1);
                });
            });

            let afterMtime = 0;
            if (fs.existsSync(configPath)) {
                afterMtime = fs.statSync(configPath).mtimeMs;
            }

            if (afterMtime > 0 && afterMtime > beforeMtime) {
                console.log(`[OAuth] CLI exited successfully – authentication complete`);
                event.reply(IPC_EVENTS.AUTH_OAUTH_COMPLETE, { success: true });
            } else if (!this.wasCancelled) {
                console.log(`[OAuth] CLI exited but config.json was not updated. Code: ${exitCode}`);
                throw new Error(`Authentication cancelled or failed.`);
            }
        } catch (error: unknown) {
            if (this.wasCancelled) return;
            console.error('[OAuth] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            event.reply(IPC_EVENTS.AUTH_OAUTH_COMPLETE, { success: false, error: errorMessage });
        } finally {
            // Ensure process is always cleaned up, even if cancel() already handled it
            if (this.cliProcess && !this.cliProcess.killed) {
                this.cliProcess.kill();
            }
            this.cliProcess = null;
        }
    }

    /**
     * Automated Anthropic OAuth flow:
     * Stage 1 — Run `claude setup-token` (opens browser for OAuth) and capture the token from stdout.
     * Stage 2 — Pipe the captured token into `openclaw models auth paste-token --provider anthropic`.
     */
    private async authenticateAnthropic(event: IpcMainEvent) {
        try {
            console.log('[OAuth/Anthropic] Starting two-stage automated flow');

            const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
            let beforeMtime = 0;
            if (fs.existsSync(configPath)) {
                beforeMtime = fs.statSync(configPath).mtimeMs;
            }

            // ── Stage 1: Run `claude setup-token` and capture the token ──
            console.log('[OAuth/Anthropic] Stage 1: Running `claude setup-token` to open browser...');

            const capturedToken = await new Promise<string>((resolve, reject) => {
                const stage1Script = `
spawn -noecho claude setup-token
set timeout 300
expect eof
`;
                this.cliProcess = spawn('expect', ['-c', stage1Script], {
                    stdio: ['ignore', 'pipe', 'pipe'],
                    env: this.buildCliEnv(),
                });

                let stdoutBuffer = '';

                this.cliProcess.stdout?.on('data', (data: Buffer) => {
                    const text = data.toString();
                    console.log(`[OAuth/Anthropic Stage1]: ${text.trim()}`);
                    stdoutBuffer += text;
                });

                this.cliProcess.stderr?.on('data', (data: Buffer) => {
                    const line = data.toString().trim();
                    if (line) console.error(`[OAuth/Anthropic Stage1 stderr]: ${line}`);
                });

                this.cliProcess.on('close', (code) => {
                    if (this.wasCancelled) {
                        reject(new Error('Cancelled'));
                        return;
                    }
                    // Use a regex directly on the raw buffer to extract the token.
                    // This is robust against ANSI escape codes and control characters
                    // that `expect` injects around the token line, which break line-based parsing.
                    const tokenMatch = stdoutBuffer.match(/sk-ant-oat01-[A-Za-z0-9_-]{60,}/);
                    if (tokenMatch) {
                        console.log('[OAuth/Anthropic] Captured setup-token from CLI output');
                        resolve(tokenMatch[0]);
                    } else {
                        reject(new Error(
                            `claude setup-token exited (code ${code ?? 'unknown'}) without producing a token. ` +
                            `Is the Claude CLI installed and authenticated?`
                        ));
                    }
                });
            });

            if (this.wasCancelled) return;

            if (!/^[A-Za-z0-9_-]+$/.test(capturedToken)) {
                throw new Error(
                    '[OAuth/Anthropic] Captured token contains unexpected characters; aborting to prevent script injection.'
                );
            }

            // ── Stage 2: Pipe the token into OpenClaw paste-token ──
            console.log('[OAuth/Anthropic] Stage 2: Registering token with OpenClaw...');

            const stage2Script = `
spawn -noecho bash -c "npx -y openclaw@latest models auth paste-token --provider anthropic"
set timeout 60
expect {
    -re "Paste token" {
        send "${capturedToken}\\r"
        exp_continue
    }
    eof
}
catch wait result
exit [lindex $result 3]
`;

            this.cliProcess = spawn('expect', ['-c', stage2Script], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: this.buildCliEnv(),
            });

            this.cliProcess.stdout?.on('data', (data: Buffer) => {
                const line = data.toString().trim();
                if (line) console.log(`[OAuth/Anthropic Stage2]: ${line}`);
            });
            this.cliProcess.stderr?.on('data', (data: Buffer) => {
                const line = data.toString().trim();
                if (line) console.error(`[OAuth/Anthropic Stage2 stderr]: ${line}`);
            });

            await new Promise<void>((resolve, reject) => {
                this.cliProcess!.on('close', (code) => {
                    if (this.wasCancelled) { reject(new Error('Cancelled')); return; }
                    if (code === 0) { resolve(); } else { reject(new Error(`paste-token exited with code ${code}`)); }
                });
            });

            // ── Verify config was updated ──
            let afterMtime = 0;
            if (fs.existsSync(configPath)) {
                afterMtime = fs.statSync(configPath).mtimeMs;
            }

            if (afterMtime > 0 && afterMtime > beforeMtime) {
                console.log('[OAuth/Anthropic] Config updated – authentication complete');
                event.reply(IPC_EVENTS.AUTH_OAUTH_COMPLETE, { success: true });
            } else if (!this.wasCancelled) {
                throw new Error('Authentication completed but config was not updated.');
            }

        } catch (error: unknown) {
            if (this.wasCancelled) return;
            console.error('[OAuth/Anthropic] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Anthropic authentication failed';
            event.reply(IPC_EVENTS.AUTH_OAUTH_COMPLETE, { success: false, error: errorMessage });
        } finally {
            if (this.cliProcess && !this.cliProcess.killed) {
                this.cliProcess.kill();
            }
            this.cliProcess = null;
        }
    }

    /**
     * Terminate any active CLI process (e.g. if the user cancels or closes the window).
     */
    cancel() {
        this.wasCancelled = true;
        if (this.cliProcess && !this.cliProcess.killed) {
            console.log('[OAuth] Forcefully terminating active CLI process');
            this.cliProcess.kill('SIGTERM');
            this.cliProcess = null;
        }
    }

    /**
     * Returns a copy of `args` with sensitive values replaced by "<REDACTED>".
     * Rule 1: Any value immediately following a known secret flag is redacted.
     * Rule 2: Any non-flag standalone value matching a long credential pattern is redacted.
     */
    private sanitizeArgs(args: string[]): string[] {
        const sanitized: string[] = [];
        let redactNext = false;

        for (const arg of args) {
            if (redactNext) {
                sanitized.push('<REDACTED>');
                redactNext = false;
            } else if (SECRET_FLAGS.test(arg)) {
                sanitized.push(arg);     // keep the flag name visible
                redactNext = true;       // redact its value on the next iteration
            } else if (!arg.startsWith('-') && SECRET_VALUE_PATTERN.test(arg)) {
                sanitized.push('<REDACTED>');
            } else {
                sanitized.push(arg);
            }
        }

        return sanitized;
    }

    /**
     * Safely executes an npx command using an argument array to prevent shell injection.
     */
    private async runNpxCommand(args: string[], env: NodeJS.ProcessEnv): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
            const sanitizedArgs = this.sanitizeArgs(args);
            console.log(`[OpenClawService] Executing: ${command} ${sanitizedArgs.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`);

            this.cliProcess = spawn(command, args, {
                env,
                shell: false,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            this.cliProcess.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            this.cliProcess.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            this.cliProcess.on('error', (err) => {
                this.cliProcess = null;
                reject(err);
            });

            this.cliProcess.on('close', (code) => {
                this.cliProcess = null;
                if (code !== 0) {
                    reject(new Error(`Command failed with exit code ${code}\nStderr: ${stderr}`));
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    /**
     * Tries `gateway restart` first (for existing daemon installations).
     * Falls back to `gateway start` for fresh installs where the gateway has never run.
     * Throws if both commands fail.
     */
    private async ensureGatewayRunning(): Promise<void> {
        const env = this.buildCliEnv();
        try {
            await this.runNpxCommand(['openclaw@latest', 'gateway', 'restart'], env);
            console.log('[OpenClawService] Gateway restarted successfully.');
        } catch (restartErr) {
            console.warn('[OpenClawService] gateway restart failed, attempting gateway start:', restartErr);
            await this.runNpxCommand(['openclaw@latest', 'gateway', 'start'], env);
            console.log('[OpenClawService] Gateway started successfully.');
        }
    }

    async deploy(event: IpcMainEvent, payload: DeploymentPayload) {
        if (this.cliProcess) {
            console.warn('[OpenClawService] Operation already in progress, ignoring.');
            event.reply(IPC_EVENTS.DEPLOYMENT_ERROR, { message: 'An operation is already in progress.' });
            return;
        }
        this.resetState();
        try {
            console.log('Orchestrating deployment for:', payload.agentTemplateIds);

            // Step 1: Auth (UI Step 1 -> Phase 2 OpenClaw Bootstrapping)
            this.emitProgress(event, 1, 'Bootstrapping core OpenClaw configuration...');

            const baseArgs = ['openclaw@latest', 'onboard', '--non-interactive', '--accept-risk'];
            let onboardArgs: string[] = [];

            if (payload.aiAuthType === 'oauth') {
                if (!payload.isAiAuthenticated) {
                    throw new Error("OAuth authentication was not completed successfully.");
                }
                const entry = OAUTH_PROVIDER_MAP[payload.aiProvider];
                const authChoice = entry?.provider || payload.aiProvider;

                onboardArgs = [
                    ...baseArgs,
                    '--auth-choice', authChoice,
                    '--install-daemon', '--skip-channels', '--skip-skills', '--skip-health'
                ];
            } else {
                // API Key Flow
                const aiProvider = payload.aiProvider.toLowerCase();
                const apiKey = payload.aiApiKey || "";

                if (!apiKey) {
                    throw new Error("API key is required for API key authentication.");
                }

                let authChoice = `${aiProvider}-api-key`;
                let apiKeyFlag = `--${aiProvider}-api-key`;

                if (aiProvider === 'anthropic-api') {
                    authChoice = 'apiKey';
                    apiKeyFlag = '--anthropic-api-key';
                } else if (aiProvider === 'openai-api') {
                    authChoice = 'openai-api-key';
                    apiKeyFlag = '--openai-api-key';
                }

                onboardArgs = [
                    ...baseArgs,
                    '--auth-choice', authChoice,
                    apiKeyFlag, apiKey,
                    '--secret-input-mode', 'plaintext',
                    '--install-daemon', '--skip-channels', '--skip-skills', '--skip-health'
                ];
            }

            const { stdout, stderr } = await this.runNpxCommand(onboardArgs, this.buildCliEnv());
            if (stderr && stderr.trim()) {
                console.warn(`Command stderr: ${stderr}`);
            }
            console.log(`Command stdout: ${stdout}`);

            // Write the selected model to ~/.openclaw/openclaw.json
            // openclaw onboard doesn't accept a --model flag; the default model
            // must be written directly to the config file.
            const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
            const providerPrefix: Record<string, string> = {
                'openai-api': 'openai',
                'openai-codex': 'openai-codex',
                'anthropic-api': 'anthropic',
                'anthropic-oauth': 'anthropic',
            };
            const prefix = providerPrefix[payload.aiProvider] || payload.aiProvider;
            const modelPrimary = `${prefix}/${payload.aiModel}`;

            let config: Record<string, unknown> = {};
            if (fs.existsSync(configPath)) {
                try {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                } catch { /* start fresh if unparseable */ }
            }

            const agents = (config.agents ?? {}) as Record<string, unknown>;
            const defaults = (agents.defaults ?? {}) as Record<string, unknown>;
            const model = (defaults.model ?? {}) as Record<string, unknown>;
            model.primary = modelPrimary;
            defaults.model = model;
            agents.defaults = defaults;
            config.agents = agents;

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
            console.log(`[OpenClawService] Set default model to: ${modelPrimary}`);

            // Step 2: Channels
            this.emitProgress(event, 2, 'Configuring channel...');
            if (payload.selectedChannel === 'telegram' || payload.selectedChannel === 'discord') {
                await this.runNpxCommand([
                    'openclaw@latest', 'channels', 'add',
                    '--channel', payload.selectedChannel,
                    '--token', payload.channelToken,
                ], this.buildCliEnv());
            } else {
                throw new Error(`Unsupported channel: ${payload.selectedChannel}`);
            }

            // Step 3: Create agent workspaces
            this.emitProgress(event, 3, 'Creating agent workspaces...');
            for (const agentId of payload.agentTemplateIds) {
                this.emitProgress(event, 3, `Creating ${agentId}'s workspace...`);
                const workspacePath = path.join(os.homedir(), '.openclaw', `workspace-${agentId}`);
                await this.runNpxCommand([
                    'openclaw@latest', 'agents', 'add', agentId,
                    '--workspace', workspacePath,
                    '--non-interactive',
                ], this.buildCliEnv());
            }

            // Step 4: Write USER.md into each agent workspace
            this.emitProgress(event, 4, 'Writing USER.md...');
            const userMdContent = generateUserMd(payload);
            for (const agentId of payload.agentTemplateIds) {
                const agentWorkspace = path.join(os.homedir(), '.openclaw', `workspace-${agentId}`);
                fs.writeFileSync(path.join(agentWorkspace, 'USER.md'), userMdContent, 'utf-8');
            }

            // Step 5: Write per-agent AGENTS.md
            this.emitProgress(event, 5, 'Writing AGENTS.md...');
            for (const agentId of payload.agentTemplateIds) {
                const agentWorkspace = path.join(os.homedir(), '.openclaw', `workspace-${agentId}`);
                fs.writeFileSync(
                    path.join(agentWorkspace, 'AGENTS.md'),
                    this.generateAgentsMd(agentId, payload.tools ?? []),
                    'utf-8'
                );
            }

            // Step 6: Copy SOUL.md templates and remove BOOTSTRAP.md
            this.emitProgress(event, 6, 'Copying SOUL.md templates...');
            const resourcesPath = this.getResourcesPath();
            for (const agentId of payload.agentTemplateIds) {
                const templateFile = SOUL_TEMPLATE_FILES[agentId];
                if (!templateFile) {
                    throw new Error(`No SOUL.md template found for agent: ${agentId}`);
                }
                const src = path.join(resourcesPath, 'soul-templates', templateFile);
                const dest = path.join(os.homedir(), '.openclaw', `workspace-${agentId}`, 'SOUL.md');
                fs.copyFileSync(src, dest);

                const bootstrapPath = path.join(os.homedir(), '.openclaw', `workspace-${agentId}`, 'BOOTSTRAP.md');
                if (fs.existsSync(bootstrapPath)) fs.unlinkSync(bootstrapPath);
            }

            // Step 8: Gateway startup — restart if already running, fall back to start for fresh installs
            this.emitProgress(event, 8, 'Starting OpenClaw gateway...');
            await this.ensureGatewayRunning();

            // Step 9: Deep health check — probes channel connectivity
            this.emitProgress(event, 9, 'Running health checks...');
            await this.runNpxCommand(
                ['openclaw@latest', 'status', '--deep', '--json', '--timeout', '10000'],
                this.buildCliEnv()
            );

            event.reply(IPC_EVENTS.DEPLOYMENT_SUCCESS, { success: true });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during deployment.';
            event.reply(IPC_EVENTS.DEPLOYMENT_ERROR, { message: errorMessage });
        }
    }
}
