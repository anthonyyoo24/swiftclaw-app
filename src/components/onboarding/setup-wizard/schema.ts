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

export const onboardingSchema = z.object({
    // Personalization steps
    usageType: z.enum(USAGE_TYPES).optional(),
    userName: z.string().min(1, "Name is required").optional(),
    timezone: z.string().min(1, "Timezone is required").optional(),
    businessDescription: z.string().optional(),
    goals: z.array(z.string().min(1)).min(1, "Select at least one goal").optional(),
    customGoal: z.string().optional(),
    workflows: z.array(z.string().min(1)).min(1, "Select at least one workflow").optional(),
    customWorkflow: z.string().optional(),
    tools: z.array(z.string()).optional(),
    agentTemplateId: z.enum(AGENT_TEMPLATES).optional(),

    // Setup steps
    aiProvider: z.string().min(1, "Please select an AI provider").optional(),
    aiModel: z.string().min(1, "Please select a model").optional(),
    aiApiKey: z.string().min(5, "API Key must be at least 5 characters").optional(),
    selectedChannel: z.enum(SUPPORTED_CHANNEL_IDS, {
        message: "Please select a supported channel",
    }).optional(),
    channelToken: z.string().min(5, "Token must be at least 5 characters").optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

