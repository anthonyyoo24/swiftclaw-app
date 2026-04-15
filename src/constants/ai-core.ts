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

/**
 * Staggered cron schedules for the 8 specialist agents (Sarah is excluded — she runs persistently).
 * Each agent fires every 15 minutes, offset by ~2 minutes to avoid simultaneous wakeups.
 */
export const AGENT_CRON_SCHEDULE: Record<string, string> = {
    maya:  '0,15,30,45 * * * *',
    jack:  '2,17,32,47 * * * *',
    lily:  '4,19,34,49 * * * *',
    max:   '6,21,36,51 * * * *',
    emma:  '8,23,38,53 * * * *',
    chris: '10,25,40,55 * * * *',
    kevin: '12,27,42,57 * * * *',
    zoe:   '14,29,44,59 * * * *',
};

/**
 * Maps agent template IDs to their display name and role.
 * Roles are derived from the soul template filenames (e.g. sarah_coordinator → Coordinator).
 */
export const AGENT_ROLES: Record<string, { displayName: string; role: string; avatar?: string }> = {
    maya:  { displayName: "Maya",  role: "Support",     avatar: "/avatars/maya-customer-support.png" },
    jack:  { displayName: "Jack",  role: "Sales",       avatar: "/avatars/jack-sales-rep.png" },
    lily:  { displayName: "Lily",  role: "Content",     avatar: "/avatars/lily-content-writer.png" },
    max:   { displayName: "Max",   role: "Research",    avatar: "/avatars/max-research-analyst.png" },
    sarah: { displayName: "Sarah", role: "Coordinator", avatar: "/avatars/sarah-product-manager.png" },
    emma:  { displayName: "Emma",  role: "Admin",       avatar: "/avatars/emma-admin-assistant.png" },
    chris: { displayName: "Chris", role: "QA",          avatar: "/avatars/chris-qa-engineer.png" },
    kevin: { displayName: "Kevin", role: "Developer",   avatar: "/avatars/kevin-software-engineer.png" },
    zoe:   { displayName: "Zoe",   role: "Designer",    avatar: "/avatars/zoe-designer.png" },
};
