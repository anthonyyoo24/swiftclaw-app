"use client";

import { Input } from "@/components/ui/input";

interface UserNameStepProps {
    value: string;
    onChange: (value: string) => void;
}

export function UserNameStep({ value, onChange }: UserNameStepProps) {
    return (
        <div className="w-full max-w-lg mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">What&apos;s your name?</h1>
                <p className="text-neutral-400">Your agent will use this to address you personally.</p>
            </div>

            <div className="space-y-3">
                <label htmlFor="user-name" className="text-sm font-medium text-neutral-300">
                    First name
                </label>
                <Input
                    id="user-name"
                    type="text"
                    placeholder="e.g. Anthony"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus
                    className="h-14 text-lg bg-white/5 border-white/10 focus:border-white/40 text-white placeholder:text-neutral-600 rounded-xl transition-colors"
                />
            </div>

            {value.trim() && (
                <p className="text-center text-neutral-400 text-sm animate-in fade-in duration-300">
                    Nice to meet you, <span className="text-white font-medium">{value.trim()}</span> 👋
                </p>
            )}
        </div>
    );
}
