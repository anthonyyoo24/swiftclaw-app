import { Anthropic, OpenAI } from "@lobehub/icons";
import type { DropdownOption } from "@/components/ui/CustomDropdown";

export const PROVIDER_OPTIONS: DropdownOption[] = [
    { id: "openai-api", label: "OpenAI (API Key)", icon: <OpenAI size={20} className="w-5 h-5 text-[#10A37F]" /> },
    { id: "openai-codex", label: "OpenAI Codex (Browser Login)", icon: <OpenAI size={20} className="w-5 h-5 text-[#10A37F]" /> },
    { id: "anthropic-api", label: "Anthropic (API Key)", icon: <Anthropic size={20} className="w-5 h-5 text-[#D97757]" /> },
    { id: "anthropic-oauth", label: "Anthropic (Browser Login)", icon: <Anthropic size={20} className="w-5 h-5 text-[#D97757]" /> },
];

export const MODEL_OPTIONS: Record<string, DropdownOption[]> = {
    "openai-api": [
        { id: "gpt-5.4", label: "GPT-5.4" },
        { id: "gpt-5.4-pro", label: "GPT-5.4 Pro" },
        { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
        { id: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
        { id: "gpt-5.2", label: "GPT-5.2" },
        { id: "gpt-4o", label: "GPT-4o" },
    ],
    "openai-codex": [
        { id: "gpt-5.4", label: "GPT-5.4" },
        { id: "gpt-5.3-codex-spark", label: "GPT-5.3 Codex Spark" },
        { id: "gpt-5.3-codex", label: "GPT-5.3 Codex" },
        { id: "gpt-5.2-codex", label: "GPT-5.2 Codex" },
        { id: "gpt-5.1-codex", label: "GPT-5.1 Codex" },
    ],
    "anthropic-api": [
        { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
        { id: "claude-opus-4-5", label: "Claude Opus 4.5" },
        { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
        { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
    "anthropic-oauth": [
        { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
        { id: "claude-opus-4-5", label: "Claude Opus 4.5" },
        { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    ],
};
