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

export const onboardingSchema = z.object({
    // Step 1 — Usage type (routing gate)
    usageType: z.enum(USAGE_TYPES),

    // Step 2 — User identity
    userName: z.string().min(1, "Name is required"),

    // Step 3 — Timezone
    timezone: z.string().min(1, "Timezone is required"),

    // Step 4 — Business description (conditional: only required when usageType === "business")
    businessDescription: z.string().optional(),

    // Step 5 — Goals (multi-select)
    goals: z.array(z.string().min(1)).min(1, "Select at least one goal"),

    // Step 6 — Workflows (multi-select + free text)
    workflows: z.array(z.string().min(1)).min(1, "Select at least one workflow"),

    // Step 7 — Tools (multi-select, optional)
    tools: z.array(z.string()),

    // Step 8 — Character selection
    agentTemplateId: z.enum(AGENT_TEMPLATES),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
