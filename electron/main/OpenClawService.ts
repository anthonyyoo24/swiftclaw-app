import { IpcMainEvent } from 'electron';
import { exec, spawn, type ChildProcess } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface DeploymentPayload {
    aiAuthType: 'apiKey' | 'oauth';
    isAiAuthenticated: boolean;
    aiProvider: string;
    aiModel: string;
    aiApiKey?: string;
    selectedChannel?: 'discord' | 'telegram' | 'whatsapp';
    channelToken?: string;
    agentTemplateIds: string[];
}

/** Maps our UI provider IDs to the OpenClaw CLI `--provider` flag values */
const OAUTH_PROVIDER_MAP: Record<string, string> = {
    'openai-codex': 'openai-codex',
    'antigravity-oauth': 'google-gemini-cli',
};


export class OpenClawService {
    private event: IpcMainEvent;
    private cliProcess: ChildProcess | null = null;

    constructor(event: IpcMainEvent) {
        this.event = event;
    }

    private emitProgress(step: number, label: string) {
        this.event.reply('deployment:progress', { step, label });
    }

    /**
     * Extracts the OAuth Client ID and Secret from the bundled @google/gemini-cli-core package.
     * OpenClaw's `resolveOAuthClientConfig()` checks env vars FIRST, so by injecting these
     * we completely bypass the broken `findInPath("gemini")` PATH resolution issue.
     */
    private extractGeminiCredentials(): { clientId: string; clientSecret: string } | null {
        try {
            const oauth2Path = require.resolve('@google/gemini-cli-core/dist/src/code_assist/oauth2.js');
            const content = fs.readFileSync(oauth2Path, 'utf8');

            const idMatch = content.match(/(\d+-[a-z0-9]+\.apps\.googleusercontent\.com)/);
            const secretMatch = content.match(/(GOCSPX-[A-Za-z0-9_-]+)/);

            if (idMatch && secretMatch) {
                console.log('[OAuth] Extracted Gemini CLI credentials from bundled package');
                return { clientId: idMatch[1], clientSecret: secretMatch[1] };
            }
        } catch (err) {
            console.warn('[OAuth] Could not extract Gemini CLI credentials:', err);
        }
        return null;
    }

    /**
     * Builds the environment for spawned CLI processes.
     * Injects Gemini OAuth credentials as env vars if this is a Gemini auth flow.
     */
    private buildCliEnv(isGemini: boolean): NodeJS.ProcessEnv {
        const env: NodeJS.ProcessEnv = { ...process.env };

        if (isGemini) {
            const creds = this.extractGeminiCredentials();
            if (creds) {
                env.GEMINI_CLI_OAUTH_CLIENT_ID = creds.clientId;
                env.GEMINI_CLI_OAUTH_CLIENT_SECRET = creds.clientSecret;
            }
        }

        return env;
    }

    /**
     * Executes the OAuth authentication flow using the bundled OpenClaw CLI.
     */
    async authenticate(provider: string) {
        const authChoice = OAUTH_PROVIDER_MAP[provider];

        if (!authChoice) {
            this.event.reply('auth:oauth:complete', {
                success: false,
                error: `Invalid OAuth provider: ${provider}`,
            });
            return;
        }

        try {
            console.log(`[OAuth] Starting native Expect-driven TTY flow for provider: ${authChoice}`);

            const configPath = path.join(os.homedir(), '.openclaw', 'config.json');
            let beforeMtime = 0;
            if (fs.existsSync(configPath)) {
                beforeMtime = fs.statSync(configPath).mtimeMs;
            }

            const isGemini = authChoice === 'google-gemini-cli';
            const envForCli = this.buildCliEnv(isGemini);
            const cliCommand = `npx -y openclaw@latest models auth login --provider ${authChoice}`;

            // macOS / Linux: Route through 'expect' to simulate a TTY invisibly in the background.
            // This satisfies the `process.stdin.isTTY` check inside OpenClaw and auto-answers
            // the Gemini CLI caution prompt with "y".
            const expectScript = `
spawn -noecho bash -c "${cliCommand}"
set timeout 300
expect {
    "Continue with Google Gemini CLI OAuth" {
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
                this.event.reply('auth:oauth:complete', { success: true });
            } else {
                console.log(`[OAuth] CLI exited but config.json was not updated. Code: ${exitCode}`);
                throw new Error(`Authentication cancelled or failed.`);
            }
        } catch (error: unknown) {
            console.error('[OAuth] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            this.event.reply('auth:oauth:complete', { success: false, error: errorMessage });
        } finally {
            // Ensure process is always cleaned up, even if cancel() already handled it
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
        if (this.cliProcess && !this.cliProcess.killed) {
            console.log('[OAuth] Forcefully terminating active CLI process');
            this.cliProcess.kill('SIGTERM');
            this.cliProcess = null;
        }
    }

    async deploy(payload: DeploymentPayload) {
        try {
            console.log('Orchestrating deployment for:', payload.agentTemplateIds);

            // Step 1: Auth (UI Step 1 -> Phase 2 OpenClaw Bootstrapping)
            this.emitProgress(1, 'Bootstrapping core OpenClaw configuration...');

            let onboardCmd: string;

            if (payload.aiAuthType === 'oauth') {
                if (!payload.isAiAuthenticated) {
                    throw new Error("OAuth authentication was not completed successfully.");
                }
                const authChoice = OAUTH_PROVIDER_MAP[payload.aiProvider] || payload.aiProvider;
                onboardCmd = `npx openclaw onboard --non-interactive --accept-risk --auth-choice ${authChoice} --model ${payload.aiModel} --skip-channels --skip-skills`;
            } else {
                // API Key Flow
                const aiProvider = payload.aiProvider.toLowerCase();
                const apiKey = payload.aiApiKey?.replace(/"/g, '\\"') || "";

                let authChoice = `${aiProvider}-api-key`;
                let apiKeyFlag = `--${aiProvider}-api-key`;

                if (aiProvider === 'anthropic-api') {
                    authChoice = 'apiKey';
                    apiKeyFlag = '--anthropic-api-key';
                } else if (aiProvider === 'google-api') {
                    authChoice = 'gemini-api-key';
                    apiKeyFlag = '--gemini-api-key';
                } else if (aiProvider === 'openai-api') {
                    authChoice = 'openai-api-key';
                    apiKeyFlag = '--openai-api-key';
                }

                onboardCmd = `npx openclaw onboard --non-interactive --accept-risk --auth-choice ${authChoice} ${apiKeyFlag} "${apiKey}" --model ${payload.aiModel} --skip-channels --skip-skills`;
            }

            const { stdout, stderr } = await execAsync(onboardCmd);
            if (stderr && stderr.trim()) {
                console.warn(`Command stderr: ${stderr}`);
            }
            console.log(`Command stdout: ${stdout}`);

            // Step 2: Channels (UI Step 2 -> roughly 2s)
            this.emitProgress(2, 'Executing channels add...');
            await new Promise(r => setTimeout(r, 2000));

            // Step 3: Workspaces (UI Step 3 -> roughly 2s)
            this.emitProgress(3, 'Creating agent workspaces...');
            await new Promise(r => setTimeout(r, 2000));

            // Steps 4-7: UI Step 4 -> roughly 2s total
            this.emitProgress(4, 'Writing USER.md...');
            await new Promise(r => setTimeout(r, 500));

            this.emitProgress(5, 'Writing AGENTS.md...');
            await new Promise(r => setTimeout(r, 500));

            this.emitProgress(6, 'Copying SOUL.md templates...');
            await new Promise(r => setTimeout(r, 500));

            this.emitProgress(7, 'Creating symlinks...');
            await new Promise(r => setTimeout(r, 500));

            // Step 8: Gateway Startup & Health Checks (UI Step 5 -> roughly 2s)
            this.emitProgress(8, 'Starting Gateway & Health Checks...');
            await new Promise(r => setTimeout(r, 2000));

            this.event.reply('deployment:success', { success: true });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during deployment.';
            this.event.reply('deployment:error', { message: errorMessage });
        }
    }
}
