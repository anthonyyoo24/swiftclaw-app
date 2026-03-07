import { z } from "zod";

/**
 * Zod schema for the full onboarding configuration form.
 * Each field is validated individually so we can check
 * per-step validity using schema.pick().
 */
export const SUPPORTED_CHANNEL_IDS = ["telegram", "discord", "whatsapp"] as const;
export type SupportedChannelId = (typeof SUPPORTED_CHANNEL_IDS)[number];

export const onboardingSchema = z.object({
    aiProvider: z.string().min(1, "Please select an AI provider"),
    aiModel: z.string().min(1, "Please select a model"),
    aiApiKey: z.string().min(5, "API Key must be at least 5 characters"),
    selectedChannel: z.enum(SUPPORTED_CHANNEL_IDS, {
        message: "Please select a supported channel",
    }).optional(),
    channelToken: z.string().min(5, "Token must be at least 5 characters"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
