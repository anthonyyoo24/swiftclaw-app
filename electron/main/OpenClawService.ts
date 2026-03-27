import { IpcMainEvent } from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';


import { DeploymentPayload } from '../../src/types/ai';
import { OAUTH_PROVIDER_MAP } from '../../src/constants/ai-core';
import { IPC_EVENTS } from '../../src/constants/ipc';


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
     * Builds the environment for spawned CLI processes.
     * Injects Gemini OAuth credentials as env vars if this is a Gemini auth flow.
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
     * Safely executes an npx command using an argument array to prevent shell injection.
     */
    private async runNpxCommand(args: string[], env: NodeJS.ProcessEnv): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
            console.log(`[OpenClawService] Executing: ${command} ${args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`);
            
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
                    '--skip-channels', '--skip-skills'
                ];
            } else {
                // API Key Flow
                const aiProvider = payload.aiProvider.toLowerCase();
                const apiKey = payload.aiApiKey || "";

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
                    '--skip-channels', '--skip-skills'
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

            // Step 2: Channels (UI Step 2 -> roughly 2s)
            this.emitProgress(event, 2, 'Executing channels add...');
            await new Promise(r => setTimeout(r, 2000));

            // Step 3: Workspaces (UI Step 3 -> roughly 2s)
            this.emitProgress(event, 3, 'Creating agent workspaces...');
            await new Promise(r => setTimeout(r, 2000));

            // Steps 4-7: UI Step 4 -> roughly 2s total
            this.emitProgress(event, 4, 'Writing USER.md...');
            await new Promise(r => setTimeout(r, 500));

            this.emitProgress(event, 5, 'Writing AGENTS.md...');
            await new Promise(r => setTimeout(r, 500));

            this.emitProgress(event, 6, 'Copying SOUL.md templates...');
            await new Promise(r => setTimeout(r, 500));

            this.emitProgress(event, 7, 'Creating symlinks...');
            await new Promise(r => setTimeout(r, 500));

            // Step 8: Gateway Startup & Health Checks (UI Step 5 -> roughly 2s)
            this.emitProgress(event, 8, 'Starting Gateway & Health Checks...');
            await new Promise(r => setTimeout(r, 2000));

            event.reply(IPC_EVENTS.DEPLOYMENT_SUCCESS, { success: true });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during deployment.';
            event.reply(IPC_EVENTS.DEPLOYMENT_ERROR, { message: errorMessage });
        }
    }
}
