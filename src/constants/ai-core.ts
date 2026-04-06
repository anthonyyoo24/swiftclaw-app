import type { OAuthProviderEntry } from "@/types/ai";

/**
 * Maps our UI provider IDs back to OpenClaw CLI `--provider` and optional `--method` flags.
 */
export const OAUTH_PROVIDER_MAP: Record<string, OAuthProviderEntry> = {
    'openai-codex': { provider: 'openai-codex' },
    'anthropic-oauth': { provider: 'anthropic', method: 'setup-token' },
};

/**
 * Maps agent template IDs to their SOUL.md filename in resources/soul-templates/.
 */
export const SOUL_TEMPLATE_FILES: Record<string, string> = {
    maya:  'maya_support.md',
    jack:  'jack_sales.md',
    lily:  'lily_content.md',
    max:   'max_research.md',
    sarah: 'sarah_coordinator.md',
    emma:  'emma_admin.md',
    chris: 'chris_qa.md',
    kevin: 'kevin_developer.md',
    zoe:   'zoe_designer.md',
};
