"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

interface TimezoneStepProps {
    value: string;
    onChange: (value: string) => void;
}

/** Groups timezones by region for a cleaner UX in the select list. */
const COMMON_TIMEZONES = [
    // Americas
    { value: "America/New_York", label: "Eastern Time (ET) — New York" },
    { value: "America/Chicago", label: "Central Time (CT) — Chicago" },
    { value: "America/Denver", label: "Mountain Time (MT) — Denver" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT) — Los Angeles" },
    { value: "America/Toronto", label: "Eastern Time (ET) — Toronto" },
    { value: "America/Vancouver", label: "Pacific Time (PT) — Vancouver" },
    { value: "America/Sao_Paulo", label: "Brasília Time (BRT) — São Paulo" },
    // Europe
    { value: "Europe/London", label: "Greenwich Mean Time (GMT) — London" },
    { value: "Europe/Paris", label: "Central European Time (CET) — Paris" },
    { value: "Europe/Berlin", label: "Central European Time (CET) — Berlin" },
    { value: "Europe/Amsterdam", label: "Central European Time (CET) — Amsterdam" },
    { value: "Europe/Madrid", label: "Central European Time (CET) — Madrid" },
    // Asia / Pacific
    { value: "Asia/Dubai", label: "Gulf Standard Time (GST) — Dubai" },
    { value: "Asia/Kolkata", label: "India Standard Time (IST) — Mumbai" },
    { value: "Asia/Singapore", label: "Singapore Time (SGT) — Singapore" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST) — Tokyo" },
    { value: "Asia/Seoul", label: "Korea Standard Time (KST) — Seoul" },
    { value: "Asia/Shanghai", label: "China Standard Time (CST) — Shanghai" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AEST) — Sydney" },
    { value: "Pacific/Auckland", label: "New Zealand Time (NZST) — Auckland" },
];

export function TimezoneStep({ value, onChange }: TimezoneStepProps) {
    const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);

    useEffect(() => {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setDetectedTimezone(detected);

        // Auto-select detected timezone if no value has been set yet
        if (!value) {
            onChange(detected);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedLabel = COMMON_TIMEZONES.find((tz) => tz.value === value)?.label
        ?? (value ? value.replace(/_/g, " ") : null);

    return (
        <div className="w-full max-w-lg mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Where are you based?</h1>
                <p className="text-neutral-400">
                    Your agent uses your timezone to schedule and respond at the right times.
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>Timezone</span>
                    {detectedTimezone && (
                        <span className="ml-auto text-xs text-indigo-400">
                            Auto-detected
                        </span>
                    )}
                </div>
                <div className="relative">
                    <select
                        id="timezone"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(
                            "w-full h-14 px-4 rounded-xl border bg-white/5 text-white text-sm",
                            "border-white/10 focus:border-white/40 focus:outline-none",
                            "transition-colors appearance-none cursor-pointer",
                            "focus:ring-1 focus:ring-white/20"
                        )}
                    >
                        <option value="" disabled className="bg-neutral-900">
                            Select a timezone…
                        </option>
                        {COMMON_TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value} className="bg-neutral-900">
                                {tz.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
                        ▾
                    </div>
                </div>

                {selectedLabel && (
                    <p className="text-xs text-neutral-500 text-center animate-in fade-in duration-300">
                        Selected: <span className="text-neutral-300">{selectedLabel}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
