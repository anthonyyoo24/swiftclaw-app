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
    | "personal-context"
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
    userName: z.string().trim().min(1, "Name is required"),
});

export const timezoneStepSchema = z.object({
    timezone: z.string().min(1, "Timezone is required"),
});

export const businessUseStepSchema = z.object({
    businessDescription: z.string().min(1, "Please describe your business"),
});

export const personalContextStepSchema = z.object({
    personalContext: z.string().min(1, "Please tell us a bit about yourself"),
});

export const goalsStepSchema = z.object({
    goals: z.string().min(1, "Please describe your goals"),
});

export const workflowsStepSchema = z.object({
    workflows: z.array(z.string().refine(val => val !== "__CUSTOM__:", { message: "Custom workflow cannot be empty" })).min(1, "Select at least one workflow"),
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
    "personal-context": personalContextStepSchema,
    "goals": goalsStepSchema,
    "workflows": workflowsStepSchema,
    "tools": toolsStepSchema,
    "character": characterStepSchema,
    "ai-brain": aiBrainStepSchema,
    "channel-setup": channelSetupStepSchema,
    "deploy": deployStepSchema,
};

// Not a runtime validator for step navigation — that is handled per-step via
// STEP_SCHEMAS[id].safeParse(). This schema merges all step schemas in wizard
// order to (a) infer the full OnboardingFormValues type and (b) act as the
// final correctness guard right before deploy.
export const onboardingSchema = welcomeStepSchema
    .merge(usageTypeStepSchema)
    .merge(userNameStepSchema)
    .merge(timezoneStepSchema)
    .merge(businessUseStepSchema.partial()) // conditional step — personal users skip it
    .merge(personalContextStepSchema.partial()) // conditional step — business users skip it
    .merge(goalsStepSchema)
    .merge(workflowsStepSchema)
    .merge(toolsStepSchema)
    .merge(characterStepSchema)
    .merge(aiBrainStepSchema)
    .merge(channelSetupStepSchema)
    .superRefine((data, ctx) => {
        // businessDescription is only required for business users
        if (
            data.usageType === "business" &&
            (!data.businessDescription || data.businessDescription.trim() === "")
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please describe your business",
                path: ["businessDescription"],
            });
        }

        // personalContext is only required for personal users
        if (
            data.usageType === "personal" &&
            (!data.personalContext || data.personalContext.trim() === "")
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please tell us a bit about yourself",
                path: ["personalContext"],
            });
        }
    });

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
