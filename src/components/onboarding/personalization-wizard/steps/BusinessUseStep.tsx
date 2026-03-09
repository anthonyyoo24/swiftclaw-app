"use client";

import { Building2 } from "lucide-react";

interface BusinessUseStepProps {
    value: string;
    onChange: (value: string) => void;
}

const EXAMPLES = [
    "E-commerce store selling handmade jewellery",
    "SaaS platform for restaurant inventory management",
    "Solo marketing consultancy for B2B tech companies",
    "Physiotherapy clinic with 3 locations",
];

export function BusinessUseStep({ value, onChange }: BusinessUseStepProps) {
    return (
        <div className="w-full max-w-lg mx-auto space-y-8 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 mx-auto mb-4">
                    <Building2 className="w-6 h-6 text-indigo-300" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">What does your business do?</h1>
                <p className="text-neutral-400">
                    A short description helps your agent understand your industry and context.
                </p>
            </div>

            <div className="space-y-3">
                <textarea
                    placeholder="e.g. We run an e-commerce store selling handmade jewellery to customers in North America."
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                    autoFocus
                    rows={7}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 text-white placeholder:text-neutral-600 rounded-xl resize-none transition-colors text-sm leading-relaxed"
                />
            </div>
        </div>
    );
}
