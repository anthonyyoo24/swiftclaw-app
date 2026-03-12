"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";

interface ToolsStepProps {
    value: string[];
    onChange: (value: string[]) => void;
}

interface ToolOption {
    id: string;
    label: string;
    logo: string;
}

const TOOL_OPTIONS: ToolOption[] = [
    { id: "notion", label: "Notion", logo: "https://www.notion.so/images/favicon.ico" },
    { id: "slack", label: "Slack", logo: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png" },
    { id: "github", label: "GitHub", logo: "https://github.com/favicon.ico" },
    { id: "gmail", label: "Gmail", logo: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
    { id: "google-cal", label: "Google Cal", logo: "https://www.google.com/s2/favicons?domain=calendar.google.com&sz=128" },
    { id: "wordpress", label: "WordPress", logo: "https://www.google.com/s2/favicons?domain=wordpress.com&sz=128" },
    { id: "google-sheets", label: "Sheets", logo: "https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png" },
    { id: "hubspot", label: "HubSpot", logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png" },
    { id: "shopify", label: "Shopify", logo: "https://www.google.com/s2/favicons?domain=shopify.com&sz=128" },
    { id: "stripe", label: "Stripe", logo: "https://stripe.com/favicon.ico" },
    { id: "salesforce", label: "Salesforce", logo: "https://www.salesforce.com/favicon.ico" },
    { id: "jira", label: "Jira", logo: "https://jira.atlassian.com/favicon.ico" },
    { id: "linear", label: "Linear", logo: "https://linear.app/favicon.ico" },
    { id: "trello", label: "Trello", logo: "https://trello.com/favicon.ico" },
    { id: "zapier", label: "Zapier", logo: "https://www.google.com/s2/favicons?domain=zapier.com&sz=128" },
    { id: "quickbooks", label: "QuickBooks", logo: "https://www.google.com/s2/favicons?domain=quickbooks.intuit.com&sz=128" },
    { id: "figma", label: "Figma", logo: "https://www.google.com/s2/favicons?domain=figma.com&sz=128" },
    { id: "mixpanel", label: "Mixpanel", logo: "https://mixpanel.com/favicon.ico" },
    { id: "zendesk", label: "Zendesk", logo: "https://www.zendesk.com/favicon.ico" },
    { id: "typeform", label: "Typeform", logo: "https://www.google.com/s2/favicons?domain=typeform.com&sz=128" },
];

interface ToolIconProps {
    src: string;
    alt: string;
    label: string;
}

function ToolIcon({ src, alt, label }: ToolIconProps) {
    const [hasError, setHasError] = useState(false);
    const firstLetter = label.charAt(0).toUpperCase();

    if (hasError) {
        return (
            <div className="w-full h-full bg-white flex items-center justify-center">
                <span className="text-emerald-400 font-bold text-lg leading-none select-none">
                    {firstLetter}
                </span>
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={20}
            height={20}
            className="object-contain"
            onLoad={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                const isGoogleFaviconApi = src.includes("google.com/s2/favicons");
                // Google's globe placeholder renders at 16px even when sz=128 is requested.
                // A real logo will be at least 32px wide (often 64px+), so anything 16px or smaller is the fallback globe.
                if (isGoogleFaviconApi && img.naturalWidth <= 16) setHasError(true);
            }}
            onError={() => setHasError(true)}
            unoptimized
        />
    );
}

export function ToolsStep({ value, onChange }: ToolsStepProps) {
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customInputValue, setCustomInputValue] = useState("");
    const [addedCustomTools, setAddedCustomTools] = useState<string[]>([]);

    const toggle = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    const predefinedIds = new Set(TOOL_OPTIONS.map((t) => t.id));

    // Custom tools are derived from what the user explicitly added, not just the current form value
    const customTools: ToolOption[] = addedCustomTools
        .filter((id) => !predefinedIds.has(id))
        .map((id) => ({
            id,
            label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
            // sz=128 returns a real logo at high-res; the generic globe is returned at 16px
            logo: `https://www.google.com/s2/favicons?domain=${id}.com&sz=128`,
        }));

    const allTools = [...TOOL_OPTIONS, ...customTools];

    const removeCustomTool = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent toggling selection
        setAddedCustomTools((prev) => prev.filter((t) => t !== id));
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                title="What's in your stack?"
                description="Select the tools you use — your agent will learn to work with them. (Optional)"
                icon="lucide:wrench"
            />

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {allTools.map((tool) => {
                    const isSelected = value.includes(tool.id);
                    return (
                        <button
                            key={tool.id}
                            onClick={() => toggle(tool.id)}
                            className={cn(
                                "relative group flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer",
                                "transition-all duration-150 hover:-translate-y-0.5",
                                isSelected
                                    ? "bg-white/10 border-white shadow-md"
                                    : "bg-white/5 border-white/10 hover:border-white/30"
                            )}
                        >
                            <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden",
                                "transition-all duration-150",
                                isSelected ? "bg-white shadow-sm scale-110" : "bg-white/90 group-hover:bg-white group-hover:scale-105"
                            )}>
                                <ToolIcon
                                    key={tool.logo}
                                    src={tool.logo}
                                    alt={tool.label}
                                    label={tool.label}
                                />
                            </div>
                            <span className={cn(
                                "text-xs font-medium leading-tight text-center transition-colors",
                                isSelected ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
                            )}>
                                {tool.label}
                            </span>

                            {/* Delete Button for Custom Tools */}
                            {!predefinedIds.has(tool.id) && (
                                <div
                                    role="button"
                                    onClick={(e) => removeCustomTool(e, tool.id)}
                                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 opacity-0 group-hover:opacity-100  hover:text-red-400 hover:border-red-500/30 transition-all z-10"
                                    title="Remove tool"
                                >
                                    <X className="w-3 h-3" />
                                </div>
                            )}
                        </button>
                    );
                })}

                {!isAddingCustom ? (
                    <button
                        onClick={() => setIsAddingCustom(true)}
                        className={cn(
                            "group flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-dashed cursor-pointer h-21",
                            "transition-all duration-150 hover:-translate-y-0.5",
                            "bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10"
                        )}
                    >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
                            <Plus className="w-5 h-5 text-neutral-400 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-medium leading-tight text-neutral-400 group-hover:text-neutral-200 transition-colors">
                            Add Custom
                        </span>
                    </button>
                ) : (
                    <div
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border h-21 transition-all",
                            "bg-white/10 border-white/30 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50"
                        )}
                        onBlur={(e) => {
                            // Check if the focus is moving to something outside the container
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setCustomInputValue("");
                                setIsAddingCustom(false);
                            }
                        }}
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Tool name..."
                            value={customInputValue}
                            onChange={(e) => setCustomInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const cleanId = customInputValue.trim().toLowerCase().replace(/\s+/g, '-');
                                    if (cleanId && !addedCustomTools.includes(cleanId) && !predefinedIds.has(cleanId)) {
                                        setAddedCustomTools((prev) => [...prev, cleanId]);
                                    }
                                    if (cleanId && !value.includes(cleanId)) {
                                        onChange([...value, cleanId]);
                                    }
                                    setCustomInputValue("");
                                    setIsAddingCustom(false);
                                } else if (e.key === "Escape") {
                                    setCustomInputValue("");
                                    setIsAddingCustom(false);
                                }
                            }}
                            className="w-full bg-transparent text-white text-xs text-center focus:outline-none placeholder:text-neutral-400"
                        />
                        <span className="text-[10px] text-neutral-400">Press Enter</span>
                    </div>
                )}
            </div>
        </div>
    );
}
