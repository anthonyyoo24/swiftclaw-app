import type { OAuthProviderEntry } from "@/types/ai";

/**
 * Maps our UI provider IDs back to OpenClaw CLI `--provider` and optional `--method` flags.
 */
export const OAUTH_PROVIDER_MAP: Record<string, OAuthProviderEntry> = {
    'openai-codex': { provider: 'openai-codex' },
    'anthropic-oauth': { provider: 'anthropic', method: 'setup-token' },
};
