"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Wrench } from "lucide-react";

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
    { id: "google-drive", label: "Google Drive", logo: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" },
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

export function ToolsStep({ value, onChange }: ToolsStepProps) {
    const toggle = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 mx-auto mb-4">
                    <Wrench className="w-6 h-6 text-emerald-300" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">What&apos;s in your stack?</h1>
                <p className="text-neutral-400">
                    Select the tools you use — your agent will learn to work with them.{" "}
                    <span className="text-neutral-500">(Optional)</span>
                </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {TOOL_OPTIONS.map((tool) => {
                    const isSelected = value.includes(tool.id);
                    return (
                        <button
                            key={tool.id}
                            onClick={() => toggle(tool.id)}
                            className={cn(
                                "group flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer",
                                "transition-all duration-150 hover:-translate-y-0.5",
                                isSelected
                                    ? "bg-white/10 border-white shadow-md"
                                    : "bg-white/5 border-white/10 hover:border-white/30"
                            )}
                        >
                            <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden",
                                "transition-all duration-150",
                                isSelected ? "bg-white/20 scale-110" : "bg-white/10 group-hover:bg-white/15 group-hover:scale-105"
                            )}>
                                <Image
                                    src={tool.logo}
                                    alt={tool.label}
                                    width={20}
                                    height={20}
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                            <span className={cn(
                                "text-xs font-medium leading-tight text-center transition-colors",
                                isSelected ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
                            )}>
                                {tool.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {value.length > 0 && (
                <p className="text-center text-xs text-neutral-500 animate-in fade-in duration-300">
                    {value.length} tool{value.length !== 1 ? "s" : ""} selected
                </p>
            )}
        </div>
    );
}
