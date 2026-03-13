"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";
import type { UsageType } from "../schema";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import { useWizardField } from "../hooks/useWizardField";
import { Icon } from "@iconify/react";

interface UsageOption {
    id: UsageType;
    title: string;
    subtitle: string;
    icon: string;
    tags: { icon: string; label: string; position: string; hoverBorder: string; hoverShadow: string; color: string; hoverTransform: string }[];
    centerIcon: string;
    theme: {
        base: string;
        borderSelected: string;
        shadowSelected: string;
        iconText: string;
        iconShadow: string;
        centerNodeBorderHover: string;
        centerNodeGlow: string;
        syncText: string;
        bgSelectedShadow: string;
    };
    pills: { left: string; center: string; right: string };
    lines: { x1: string; y1: string; x2: string; y2: string }[];
}

const OPTIONS: UsageOption[] = [
    {
        id: "personal",
        title: "Personal",
        subtitle: "Individual workspace tailored for personal projects, experiments, and rapid prototyping.",
        icon: "lucide:user",
        theme: {
            base: "emerald",
            borderSelected: "peer-checked:border-emerald-500/50",
            shadowSelected: "peer-checked:shadow-[0_0_40px_-10px_rgba(52,211,153,0.15)]",
            iconText: "text-emerald-500",
            iconShadow: "shadow-[0_0_15px_rgba(52,211,153,0.3)]",
            centerNodeBorderHover: "hover:border-emerald-500/60",
            centerNodeGlow: "group-hover/node:shadow-[inset_0_0_10px_rgba(52,211,153,1)]",
            syncText: "text-emerald-500",
            bgSelectedShadow: "bg-emerald-500/20"
        },
        pills: { left: "Local", center: "Sync", right: "Cloud" },
        centerIcon: "lucide:zap",
        tags: [
            { icon: "logos:react", label: "React", position: "top-[20%] left-[20%]", hoverBorder: "group-hover/tag:border-blue-500", hoverShadow: "group-hover/tag:shadow-[0_10px_20px_-5px_rgba(59,130,246,0.5)]", color: "text-blue-500", hoverTransform: "group-hover/tag:rotate-180" },
            { icon: "logos:figma", label: "Figma", position: "top-[30%] left-[80%]", hoverBorder: "group-hover/tag:border-purple-500", hoverShadow: "group-hover/tag:shadow-[0_10px_20px_-5px_rgba(168,85,247,0.5)]", color: "text-purple-500", hoverTransform: "group-hover/tag:scale-110" },
            { icon: "logos:google-icon", label: "Google", position: "top-[80%] left-[50%]", hoverBorder: "group-hover/tag:border-red-500", hoverShadow: "group-hover/tag:shadow-[0_10px_20px_-5px_rgba(239,68,68,0.5)]", color: "text-red-500", hoverTransform: "group-hover/tag:-rotate-12" }
        ],
        lines: [
            { x1: "50%", y1: "50%", x2: "20%", y2: "20%" },
            { x1: "50%", y1: "50%", x2: "80%", y2: "30%" },
            { x1: "50%", y1: "50%", x2: "50%", y2: "80%" }
        ]
    },
    {
        id: "business",
        title: "Business",
        subtitle: "Enterprise-ready environment with advanced collaboration, security, and integration capabilities.",
        icon: "lucide:briefcase",
        theme: {
            base: "blue",
            borderSelected: "peer-checked:border-blue-500/50",
            shadowSelected: "peer-checked:shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)]",
            iconText: "text-blue-500",
            iconShadow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
            centerNodeBorderHover: "hover:border-blue-500/60",
            centerNodeGlow: "group-hover/node:shadow-[inset_0_0_10px_rgba(59,130,246,1)]",
            syncText: "text-blue-500",
            bgSelectedShadow: "bg-blue-500/20"
        },
        pills: { left: "Team", center: "Dist", right: "Global" },
        centerIcon: "lucide:network",
        tags: [
            { icon: "logos:docker-icon", label: "Docker", position: "top-[70%] left-[25%]", hoverBorder: "group-hover/tag:border-blue-400", hoverShadow: "group-hover/tag:shadow-[0_10px_20px_-5px_rgba(96,165,250,0.5)]", color: "text-blue-400", hoverTransform: "group-hover/tag:scale-110" },
            { icon: "logos:aws", label: "AWS", position: "top-[25%] left-[75%]", hoverBorder: "group-hover/tag:border-orange-500", hoverShadow: "group-hover/tag:shadow-[0_10px_20px_-5px_rgba(249,115,22,0.5)]", color: "text-orange-500", hoverTransform: "group-hover/tag:scale-110" },
            { icon: "logos:github-icon", label: "GitHub", position: "top-[75%] left-[80%]", hoverBorder: "group-hover/tag:border-white", hoverShadow: "group-hover/tag:shadow-[0_10px_20px_-5px_rgba(255,255,255,0.5)]", color: "text-white", hoverTransform: "group-hover/tag:scale-110" }
        ],
        lines: [
            { x1: "50%", y1: "50%", x2: "25%", y2: "70%" },
            { x1: "50%", y1: "50%", x2: "75%", y2: "25%" },
            { x1: "50%", y1: "50%", x2: "80%", y2: "75%" }
        ]
    }
];

export function UsageTypeStep() {
    const { value, onChange } = useWizardField("usageType");
    const labelRefs = useRef<(HTMLLabelElement | null)[]>([]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const currentIndex = OPTIONS.findIndex((o) => o.id === value);
            const nextIndex = (currentIndex + 1) % OPTIONS.length;
            onChange(OPTIONS[nextIndex].id);
            labelRefs.current[nextIndex]?.focus();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const currentIndex = OPTIONS.findIndex((o) => o.id === value);
            const prevIndex = (currentIndex - 1 + OPTIONS.length) % OPTIONS.length;
            onChange(OPTIONS[prevIndex].id);
            labelRefs.current[prevIndex]?.focus();
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (document.activeElement?.tagName === "LABEL") {
                const index = labelRefs.current.findIndex(el => el === document.activeElement);
                if (index !== -1) {
                    onChange(OPTIONS[index].id);
                }
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <style>
                {`
                @keyframes dash {
                    from { stroke-dashoffset: 24; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes levitate {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .font-bricolage { font-family: 'Bricolage Grotesque', sans-serif; }
                .font-space { font-family: 'Space Grotesk', sans-serif; }
                `}
            </style>
            <StepHeader
                title="How will you use SwiftClaw?"
                description="Tell us how you plan to use SwiftClaw so we can tailor your experience and default configurations."
                icon="lucide:briefcase"
            />

            <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                role="radiogroup"
                aria-label="Usage type"
                onKeyDown={handleKeyDown}
            >
                {OPTIONS.map((option, index) => {
                    const isSelected = value === option.id;

                    return (
                        <label
                            key={option.id}
                            ref={(el) => { labelRefs.current[index] = el; }}
                            className="relative block cursor-pointer group h-[600px] w-full"
                            style={{ animation: 'levitate 6s ease-in-out infinite', animationDelay: index === 1 ? '1s' : '0s' }}
                            tabIndex={isSelected ? 0 : value === undefined && index === 0 ? 0 : -1}
                            role="radio"
                            aria-checked={isSelected}
                        >
                            <input
                                type="radio"
                                name="use_case"
                                value={option.id}
                                className="peer sr-only"
                                checked={isSelected}
                                onChange={() => onChange(option.id)}
                                tabIndex={-1}
                            />
                            <div className={cn(
                                "absolute inset-0 bg-neutral-900 border border-neutral-800 rounded-[40px] flex flex-col p-8 sm:p-12 overflow-hidden transition-colors duration-500 group-hover:border-neutral-700",
                                option.theme.borderSelected,
                                option.theme.shadowSelected
                            )}>
                                {/* Background Grid Effect */}
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

                                <div className="relative z-10 flex flex-col items-start">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6",
                                        option.theme.iconShadow
                                    )}>
                                        <Icon icon={option.icon} className={cn("text-xl", option.theme.iconText)} />
                                    </div>
                                    <h2 className="text-[24px] uppercase font-semibold text-white tracking-tight font-bricolage mb-3">
                                        {option.title}
                                    </h2>
                                    <p className="text-[14px] text-neutral-400 leading-relaxed max-w-[320px] font-space mb-6">
                                        {option.subtitle}
                                    </p>
                                </div>

                                <div className="relative flex-1 mt-8 w-full [perspective:1000px] flex items-center justify-center pointer-events-none">
                                    <div className="relative w-full h-full flex items-center justify-center [transform:rotateX(12deg)] transition-transform duration-500 pointer-events-auto">
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                            {option.lines.map((line, i) => (
                                                <line
                                                    key={i}
                                                    x1={line.x1}
                                                    y1={line.y1}
                                                    x2={line.x2}
                                                    y2={line.y2}
                                                    stroke="#404040"
                                                    strokeWidth="2"
                                                    strokeDasharray="6 6"
                                                    style={{ animation: 'dash 3s linear infinite' }}
                                                />
                                            ))}
                                        </svg>

                                        <div className={cn(
                                            "absolute z-10 w-6 h-6 rounded-lg bg-neutral-950 border flex items-center justify-center transition-all duration-300 group/node cursor-pointer",
                                            option.theme.iconText === "text-emerald-500" ? "border-emerald-500/30" : "border-blue-500/30",
                                            option.theme.centerNodeBorderHover
                                        )}>
                                            <div className={cn(
                                                "absolute w-[128px] h-[128px] blur-[40px] rounded-full pointer-events-none",
                                                option.theme.bgSelectedShadow
                                            )}></div>
                                            <div className={cn(
                                                "absolute inset-0 rounded-lg transition-shadow duration-300 pointer-events-none",
                                                option.theme.iconText === "text-emerald-500" ? "shadow-[inset_0_0_10px_rgba(52,211,153,0)]" : "shadow-[inset_0_0_10px_rgba(59,130,246,0)]",
                                                option.theme.centerNodeGlow
                                            )}></div>
                                            <Icon icon={option.centerIcon} className={cn("text-[12px] relative z-10", option.theme.iconText)} />
                                        </div>

                                        {option.tags.map((tag, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "absolute -translate-x-1/2 -translate-y-1/2 z-20 group/tag transition-all duration-300 hover:-translate-y-2 cursor-pointer",
                                                    tag.position
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md border border-neutral-800 shadow-xl transition-all duration-300",
                                                    tag.hoverBorder,
                                                    tag.hoverShadow
                                                )}>
                                                    <Icon icon={tag.icon} className={cn("text-base transition-transform duration-500", tag.hoverTransform)} />
                                                    <span className="text-[12px] font-medium text-white">
                                                        {tag.label}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
