import { z } from "zod";

export const AGENT_TEMPLATES = [
    "maya",
    "jack",
    "lily",
    "max",
    "sarah",
    "emma",
    "chris",
    "kevin",
    "zoe",
] as const;

export type AgentTemplateId = (typeof AGENT_TEMPLATES)[number];

export const USAGE_TYPES = ["business", "personal"] as const;
export type UsageType = (typeof USAGE_TYPES)[number];

export const SUPPORTED_CHANNEL_IDS = ["telegram", "discord", "whatsapp"] as const;
export type SupportedChannelId = (typeof SUPPORTED_CHANNEL_IDS)[number];

export type StepId =
    | "welcome"
    | "usage-type"
    | "user-name"
    | "timezone"
    | "business-use"
    | "goals"
    | "workflows"
    | "tools"
    | "character"
    | "ai-brain"
    | "channel-setup"
    | "deploy";

export const welcomeStepSchema = z.object({});

export const usageTypeStepSchema = z.object({
    usageType: z.enum(USAGE_TYPES, { error: "Please select a usage type" }),
});

export const userNameStepSchema = z.object({
    userName: z.string().min(1, "Name is required"),
});

export const timezoneStepSchema = z.object({
    timezone: z.string().min(1, "Timezone is required"),
});

export const businessUseStepSchema = z.object({
    businessDescription: z.string().min(1, "Please describe your business"),
});

export const goalsStepSchema = z.object({
    goals: z.array(z.string().min(1, "Custom goal cannot be empty")).min(1, "Select at least one goal"),
});

export const workflowsStepSchema = z.object({
    workflows: z.array(z.string().min(1, "Custom workflow cannot be empty")).min(1, "Select at least one workflow"),
});

export const toolsStepSchema = z.object({
    tools: z.array(z.string()).optional(),
});

export const characterStepSchema = z.object({
    agentTemplateIds: z
        .array(z.enum(AGENT_TEMPLATES))
        .min(1, "Select at least one agent"),
});

export const aiBrainStepSchema = z.object({
    aiProvider: z.string().min(1, "Please select an AI provider"),
    aiModel: z.string().min(1, "Please select a model"),
    aiApiKey: z.string().min(5, "API Key must be at least 5 characters"),
});

export const channelSetupStepSchema = z.object({
    selectedChannel: z.enum(SUPPORTED_CHANNEL_IDS, {
        error: "Please select a supported channel",
    }),
    channelToken: z.string().min(5, "Token must be at least 5 characters"),
});

export const deployStepSchema = z.object({});

export const STEP_SCHEMAS: Record<StepId, z.ZodTypeAny> = {
    "welcome": welcomeStepSchema,
    "usage-type": usageTypeStepSchema,
    "user-name": userNameStepSchema,
    "timezone": timezoneStepSchema,
    "business-use": businessUseStepSchema,
    "goals": goalsStepSchema,
    "workflows": workflowsStepSchema,
    "tools": toolsStepSchema,
    "character": characterStepSchema,
    "ai-brain": aiBrainStepSchema,
    "channel-setup": channelSetupStepSchema,
    "deploy": deployStepSchema,
};

export const onboardingSchema = z.object({
    // Personalization steps
    usageType: z.enum(USAGE_TYPES).optional(),
    userName: z.string().min(1, "Name is required").optional(),
    timezone: z.string().min(1, "Timezone is required").optional(),
    businessDescription: z.string().optional(),
    goals: z.array(z.string().min(1)).min(1, "Select at least one goal").optional(),
    workflows: z.array(z.string().min(1)).min(1, "Select at least one workflow").optional(),
    tools: z.array(z.string()).optional(),
    agentTemplateIds: z.array(z.enum(AGENT_TEMPLATES)).optional(),

    // Setup steps
    aiProvider: z.string().min(1, "Please select an AI provider").optional(),
    aiModel: z.string().min(1, "Please select a model").optional(),
    aiApiKey: z.string().min(5, "API Key must be at least 5 characters").optional(),
    selectedChannel: z.enum(SUPPORTED_CHANNEL_IDS, {
        error: "Please select a supported channel",
    }).optional(),
    channelToken: z.string().min(5, "Token must be at least 5 characters").optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
