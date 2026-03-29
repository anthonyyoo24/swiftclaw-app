import { describe, it, expect } from 'vitest';
import { onboardingSchema, STEP_SCHEMAS } from '../schema';

// ── Shared valid personal payload ────────────────────────────────────────────

const VALID_PERSONAL = {
    usageType: 'personal',
    userName: 'Alice',
    timezone: 'America/New_York',
    personalContext: 'Software engineer',
    businessDescription: '',
    goals: 'Ship faster',
    workflows: ['code-review'],
    tools: [],
    agentTemplateIds: ['maya'],
    aiAuthType: 'apiKey',
    isAiAuthenticated: false,
    aiProvider: 'openai-api',
    aiModel: 'gpt-4o',
    aiApiKey: 'sk-test-12345',
    selectedChannel: 'telegram',
    channelToken: 'tg-token',
} as const;

// ── onboardingSchema (final deploy-gate validation) ───────────────────────────

describe('onboardingSchema', () => {
    it('accepts a fully valid personal payload', () => {
        expect(onboardingSchema.safeParse(VALID_PERSONAL).success).toBe(true);
    });

    it('rejects when userName is empty', () => {
        const result = onboardingSchema.safeParse({ ...VALID_PERSONAL, userName: '' });
        expect(result.success).toBe(false);
    });

    it('rejects when goals is empty', () => {
        expect(onboardingSchema.safeParse({ ...VALID_PERSONAL, goals: '' }).success).toBe(false);
    });

    it('rejects when workflows array is empty', () => {
        expect(onboardingSchema.safeParse({ ...VALID_PERSONAL, workflows: [] }).success).toBe(false);
    });

    it('rejects when channelToken is too short (< 5 chars)', () => {
        expect(onboardingSchema.safeParse({ ...VALID_PERSONAL, channelToken: 'abc' }).success).toBe(false);
    });

    it('rejects when usageType is business but businessDescription is missing', () => {
        const result = onboardingSchema.safeParse({
            ...VALID_PERSONAL,
            usageType: 'business',
            businessDescription: '',
        });
        expect(result.success).toBe(false);
    });

    it('accepts business usageType when businessDescription is provided', () => {
        const result = onboardingSchema.safeParse({
            ...VALID_PERSONAL,
            usageType: 'business',
            businessDescription: 'We build SaaS tools',
            personalContext: '',
        });
        expect(result.success).toBe(true);
    });

    it('rejects when personal but personalContext is missing', () => {
        expect(
            onboardingSchema.safeParse({ ...VALID_PERSONAL, personalContext: '' }).success
        ).toBe(false);
    });

    // ── AI-brain final guards (onboardingSchema re-enforces these because
    //    .merge() does not carry over aiBrainStepSchema's superRefine) ─────────

    it('rejects apiKey auth when aiApiKey is too short (< 5 chars)', () => {
        const result = onboardingSchema.safeParse({ ...VALID_PERSONAL, aiApiKey: 'abc' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('aiApiKey');
    });

    it('accepts apiKey auth when aiApiKey is exactly 5 chars', () => {
        expect(onboardingSchema.safeParse({ ...VALID_PERSONAL, aiApiKey: 'abcde' }).success).toBe(true);
    });

    it('rejects oauth auth when isAiAuthenticated is false', () => {
        const result = onboardingSchema.safeParse({
            ...VALID_PERSONAL,
            aiAuthType: 'oauth',
            isAiAuthenticated: false,
            aiApiKey: undefined,
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toContain('isAiAuthenticated');
    });

    it('accepts oauth auth when isAiAuthenticated is true', () => {
        const result = onboardingSchema.safeParse({
            ...VALID_PERSONAL,
            aiAuthType: 'oauth',
            isAiAuthenticated: true,
            aiApiKey: undefined,
        });
        expect(result.success).toBe(true);
    });
});

// ── Per-step schemas (STEP_SCHEMAS) ───────────────────────────────────────────

describe('STEP_SCHEMAS["user-name"]', () => {
    it('rejects when userName is empty', () => {
        expect(STEP_SCHEMAS['user-name'].safeParse({ userName: '' }).success).toBe(false);
    });

    it('accepts a non-empty userName', () => {
        expect(STEP_SCHEMAS['user-name'].safeParse({ userName: 'Bob' }).success).toBe(true);
    });
});

describe('STEP_SCHEMAS["workflows"]', () => {
    it('accepts at least one valid workflow', () => {
        expect(STEP_SCHEMAS['workflows'].safeParse({ workflows: ['code-review'] }).success).toBe(true);
    });

    it('rejects an empty workflows array', () => {
        expect(STEP_SCHEMAS['workflows'].safeParse({ workflows: [] }).success).toBe(false);
    });

    it('rejects a workflow entry that is exactly the sentinel value "__CUSTOM__:"', () => {
        expect(STEP_SCHEMAS['workflows'].safeParse({ workflows: ['__CUSTOM__:'] }).success).toBe(false);
    });
});

describe('STEP_SCHEMAS["ai-brain"]', () => {
    const BASE_AI = {
        aiAuthType: 'apiKey' as const,
        isAiAuthenticated: false,
        aiProvider: 'openai-api',
        aiModel: 'gpt-4o',
        aiApiKey: 'sk-valid-key-abc',
    };

    it('accepts a valid apiKey payload', () => {
        expect(STEP_SCHEMAS['ai-brain'].safeParse(BASE_AI).success).toBe(true);
    });

    it('rejects apiKey mode when key is too short (< 5 chars)', () => {
        expect(STEP_SCHEMAS['ai-brain'].safeParse({ ...BASE_AI, aiApiKey: 'abc' }).success).toBe(false);
    });

    it('rejects apiKey mode when key is missing entirely', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { aiApiKey: _, ...noKey } = BASE_AI;
        expect(STEP_SCHEMAS['ai-brain'].safeParse(noKey).success).toBe(false);
    });

    it('rejects oauth mode when isAiAuthenticated is false', () => {
        const result = STEP_SCHEMAS['ai-brain'].safeParse({
            aiAuthType: 'oauth',
            isAiAuthenticated: false,
            aiProvider: 'openai-codex',
            aiModel: 'gpt-4o',
        });
        expect(result.success).toBe(false);
    });

    it('accepts oauth mode when isAiAuthenticated is true', () => {
        const result = STEP_SCHEMAS['ai-brain'].safeParse({
            aiAuthType: 'oauth',
            isAiAuthenticated: true,
            aiProvider: 'openai-codex',
            aiModel: 'gpt-4o',
        });
        expect(result.success).toBe(true);
    });
});

describe('STEP_SCHEMAS["channel-setup"]', () => {
    it('accepts a valid telegram token of sufficient length', () => {
        expect(
            STEP_SCHEMAS['channel-setup'].safeParse({ selectedChannel: 'telegram', channelToken: 'valid-token' }).success
        ).toBe(true);
    });

    it('rejects when channelToken is too short', () => {
        expect(
            STEP_SCHEMAS['channel-setup'].safeParse({ selectedChannel: 'telegram', channelToken: 'abc' }).success
        ).toBe(false);
    });

    it('rejects when selectedChannel is an unsupported value', () => {
        expect(
            STEP_SCHEMAS['channel-setup'].safeParse({ selectedChannel: 'slack', channelToken: 'valid-token' }).success
        ).toBe(false);
    });
});
