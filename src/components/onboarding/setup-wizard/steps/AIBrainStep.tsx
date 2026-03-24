"use client";

import { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/Input";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import { Anthropic, OpenAI, Google } from "@lobehub/icons";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import type { OnboardingFormValues } from "@/components/onboarding/setup-wizard/schema";

export const PROVIDER_OPTIONS: DropdownOption[] = [
    { id: "openai-api", label: "OpenAI (API Key)", icon: <OpenAI size={20} className="w-5 h-5 text-[#10A37F]" /> },
    { id: "openai-codex", label: "OpenAI Codex (Browser Login)", icon: <OpenAI size={20} className="w-5 h-5 text-[#10A37F]" /> },
    { id: "anthropic-api", label: "Anthropic (API Key)", icon: <Anthropic size={20} className="w-5 h-5 text-[#D97757]" /> },
    { id: "anthropic-oauth", label: "Anthropic (Browser Login)", icon: <Anthropic size={20} className="w-5 h-5 text-[#D97757]" /> },
    { id: "google-api", label: "Google Gemini (API Key)", icon: <Google size={20} className="w-5 h-5 text-[#4285F4]" /> },
    { id: "antigravity-oauth", label: "AntiGravity (Google OAuth)", icon: <Google size={20} className="w-5 h-5 text-[#4285F4]" /> },
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
    "google-api": [
        { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
        { id: "gemini-3.1-flash", label: "Gemini 3.1 Flash" },
        { id: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
    ],
    "antigravity-oauth": [
        { id: "gemini-3.1-pro-high", label: "Gemini 3.1 Pro (High)" },
        { id: "gemini-3.1-pro-low", label: "Gemini 3.1 Pro (Low)" },
        { id: "gemini-3-pro-high", label: "Gemini 3 Pro (High)" },
        { id: "gemini-3-pro-low", label: "Gemini 3 Pro (Low)" },
        { id: "gemini-3.1-flash", label: "Gemini 3.1 Flash" },
    ],
};

export function AIBrainStep() {
    const { control, setValue, watch, formState: { errors } } = useFormContext<OnboardingFormValues>();
    const [showApiKey, setShowApiKey] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const provider = watch("aiProvider");
    const aiAuthType = watch("aiAuthType");
    const isAiAuthenticated = watch("isAiAuthenticated");

    const handleProviderChange = (newProvider: string) => {
        setValue("aiProvider", newProvider, { shouldValidate: true });
        setValue("aiModel", "", { shouldValidate: true });

        // Reset auth state on provider switch
        setValue("isAiAuthenticated", false, { shouldValidate: true });
        setAuthError(null);

        // Derive auth type from the ID suffix
        if (newProvider.endsWith("-oauth") || newProvider === "openai-codex") {
            setValue("aiAuthType", "oauth", { shouldValidate: true });
            // For OAuth, clear the API key just in case
            setValue("aiApiKey", "", { shouldValidate: false });
        } else {
            setValue("aiAuthType", "apiKey", { shouldValidate: true });
        }
    };

    const handleConnectClick = () => {
        if (!provider) return;
        setIsConnecting(true);
        setAuthError(null);
        window.electron.ipcRenderer.send('auth:oauth:start', { provider });
    };

    // Robust IPC Listener Management
    useEffect(() => {
        if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return;

        const cleanup = window.electron.ipcRenderer.on('auth:oauth:complete', (data: unknown) => {
            const result = data as { success: boolean; error?: string };
            setIsConnecting(false);
            if (result.success) {
                setValue("isAiAuthenticated", true, { shouldValidate: true });
                setAuthError(null);
            } else {
                setValue("isAiAuthenticated", false, { shouldValidate: true });
                setAuthError(result.error || "Authentication failed or was cancelled.");
            }
        });

        return () => {
            if (cleanup) cleanup();
            // If the user leaves the step while connecting, we should ideally tell the backend to cancel
            if (isConnecting) {
                window.electron.ipcRenderer.send('auth:oauth:cancel');
            }
        };
    }, [provider, isConnecting, setValue]);

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                icon="lucide:brain"
                title="AI Brain Selection"
                description="This selection defines the core intelligence of your SwiftClaw agent. You can change your provider and model later in the settings."
            />

            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Controller
                        name="aiProvider"
                        control={control}
                        render={({ field }) => (
                            <CustomDropdown
                                label="LLM Provider"
                                options={PROVIDER_OPTIONS}
                                value={field.value ?? ""}
                                onChange={handleProviderChange}
                                placeholder="Select provider..."
                            />
                        )}
                    />
                    {provider && (
                        <Controller
                            name="aiModel"
                            control={control}
                            render={({ field }) => (
                                <CustomDropdown
                                    label="Model Version"
                                    options={MODEL_OPTIONS[provider] || []}
                                    value={field.value ?? ""}
                                    onChange={(v) => field.onChange(v)}
                                    placeholder="Select model..."
                                />
                            )}
                        />
                    )}
                </div>

                {/* Authentication Handling */}
                {aiAuthType === "apiKey" && (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-neutral-300">
                            API Key <span className="text-blue-500">*</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-400 transition-colors">
                                <Icon icon="solar:key-linear" className="text-lg" />
                            </div>
                            <Controller
                                name="aiApiKey"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        type={showApiKey ? "text" : "password"}
                                        autoComplete="off"
                                        spellCheck={false}
                                        placeholder="sk-ant-..."
                                        variant="glass"
                                        className="pl-11 pr-12 py-3 shadow-sm"
                                    />
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-neutral-500 hover:text-neutral-300 transition-colors"
                                aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
                            >
                                <Icon icon={showApiKey ? "solar:eye-closed-linear" : "solar:eye-linear"} className="text-lg" />
                            </button>
                        </div>
                        {errors.aiApiKey && (
                            <p className="text-xs text-red-400 mt-2 px-1 flex items-center gap-1.5">
                                <Icon icon="solar:danger-circle-bold" className="text-sm" />
                                {errors.aiApiKey.message as string}
                            </p>
                        )}
                        <div className="flex items-start gap-2.5 mt-3 px-1">
                            <Icon icon="solar:info-circle-linear" className="text-neutral-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                Your API key is stored locally in your keychain and is never transmitted to SwiftClaw servers.
                            </p>
                        </div>
                    </div>
                )}

                {aiAuthType === "oauth" && (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-neutral-300">
                            Browser Authentication <span className="text-blue-500">*</span>
                        </label>

                        {isAiAuthenticated ? (
                            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/10 text-green-400">
                                <Icon icon="solar:check-circle-bold" className="text-xl" />
                                <span className="font-medium text-sm">Successfully Connected</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleConnectClick}
                                disabled={isConnecting}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConnecting ? (
                                    <>
                                        <Icon icon="lucide:loader-2" className="text-xl animate-spin text-blue-400" />
                                        <span>Waiting for browser login...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:link-bold" className="text-xl text-blue-400" />
                                        <span>Click to connect via browser</span>
                                    </>
                                )}
                            </button>
                        )}

                        {authError && (
                            <p className="text-xs text-red-400 mt-2 px-1 flex items-center gap-1.5">
                                <Icon icon="solar:danger-circle-bold" className="text-sm" />
                                {authError}
                            </p>
                        )}
                        {(errors.isAiAuthenticated && !authError) && (
                            <p className="text-xs text-red-400 mt-2 px-1 flex items-center gap-1.5">
                                <Icon icon="solar:danger-circle-bold" className="text-sm" />
                                {errors.isAiAuthenticated.message as string}
                            </p>
                        )}

                        <div className="flex items-start gap-2.5 mt-3 px-1">
                            <Icon icon="solar:info-circle-linear" className="text-neutral-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                A browser window will open to authenticate your account. This is a one-time process.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
