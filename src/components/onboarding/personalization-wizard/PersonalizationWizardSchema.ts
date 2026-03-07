import { z } from "zod";

export const AGENT_TEMPLATES = ["scholar", "rebel", "ghost", "copilot", "custom"] as const;
export type AgentTemplateId = (typeof AGENT_TEMPLATES)[number];

export const personalizationSchema = z.object({
    agentTemplateId: z.enum(AGENT_TEMPLATES),
    agentName: z.string().min(1, "Name is required"),
    agentNature: z.string().min(1, "Nature is required"),
    agentVibe: z.string().min(1, "Vibe is required"),
    agentEmoji: z.string().min(1, "Emoji is required").default("🦞"),
    coreTruths: z.array(z.string().min(1, "Truth cannot be empty")).min(1, "At least one core truth is required"),
    boundaries: z.array(z.string().min(1, "Boundary cannot be empty")).min(1, "At least one boundary is required"),
});

export type PersonalizationFormValues = z.infer<typeof personalizationSchema>;
