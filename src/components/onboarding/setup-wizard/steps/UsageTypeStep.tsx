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
    tags: { icon: string; label: string; position: string; iconClass: string }[];
    centerIcon: string;
    theme: {
        borderSelected: string;
        shadowSelected: string;
        iconText: string;
        iconShadow: string;
        centerNodeBorder: string;
        centerNodeBorderHover: string;
        centerNodeShadow: string;
        centerNodeGlow: string;
        bgSelectedShadow: string;
    };
    lines: { x1: string; y1: string; x2: string; y2: string }[];
}

const OPTIONS: UsageOption[] = [
    {
        id: "personal",
        title: "Personal",
        subtitle: "Your personal AI companion for everyday productivity. Let agents streamline your life, from planning trips to managing your digital world.",
        icon: "lucide:user",
        theme: {
            borderSelected: "peer-checked:border-emerald-500/50",
            shadowSelected: "peer-checked:shadow-[0_0_40px_-10px_rgba(52,211,153,0.15)]",
            iconText: "text-emerald-500",
            iconShadow: "shadow-[0_0_15px_rgba(52,211,153,0.3)]",
            centerNodeBorder: "border-emerald-500/30",
            centerNodeBorderHover: "hover:border-emerald-500/60",
            centerNodeShadow: "shadow-[inset_0_0_10px_rgba(52,211,153,0)]",
            centerNodeGlow: "group-hover/node:shadow-[inset_0_0_10px_rgba(52,211,153,1)]",
            bgSelectedShadow: "bg-emerald-500/20"
        },
        centerIcon: "lucide:zap",
        tags: [
            { icon: "simple-icons:notion", label: "Notion", position: "top-[30%] left-[30%]", iconClass: "text-white" },
            { icon: "logos:figma", label: "Figma", position: "top-[35%] left-[70%]", iconClass: "" },
            { icon: "logos:google-icon", label: "Google", position: "top-[70%] left-[50%]", iconClass: "" }
        ],
        lines: [
            { x1: "50%", y1: "50%", x2: "30%", y2: "30%" },
            { x1: "50%", y1: "50%", x2: "70%", y2: "35%" },
            { x1: "50%", y1: "50%", x2: "50%", y2: "70%" }
        ]
    },
    {
        id: "business",
        title: "Business",
        subtitle: "Transform your business with an AI workforce. Deploy agents to automate sales funnels, administrative tasks, and content creation.",
        icon: "lucide:briefcase",
        theme: {
            borderSelected: "peer-checked:border-blue-500/50",
            shadowSelected: "peer-checked:shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)]",
            iconText: "text-blue-500",
            iconShadow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
            centerNodeBorder: "border-blue-500/30",
            centerNodeBorderHover: "hover:border-blue-500/60",
            centerNodeShadow: "shadow-[inset_0_0_10px_rgba(59,130,246,0)]",
            centerNodeGlow: "group-hover/node:shadow-[inset_0_0_10px_rgba(59,130,246,1)]",
            bgSelectedShadow: "bg-blue-500/20"
        },
        centerIcon: "lucide:network",
        tags: [
            { icon: "logos:docker-icon", label: "Docker", position: "top-[70%] left-[25%]", iconClass: "" },
            { icon: "simple-icons:stripe", label: "Stripe", position: "top-[30%] left-[65%]", iconClass: "text-[#635BFF]" },
            { icon: "mdi:github", label: "GitHub", position: "top-[70%] left-[75%]", iconClass: "text-white" }
        ],
        lines: [
            { x1: "50%", y1: "50%", x2: "25%", y2: "70%" },
            { x1: "50%", y1: "50%", x2: "65%", y2: "30%" },
            { x1: "50%", y1: "50%", x2: "75%", y2: "70%" }
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
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 flex-1 flex flex-col relative z-10">
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
                description="Tell us how you plan to use SwiftClaw so we can tailor your experience accordingly."
                icon="lucide:briefcase"
                className="mb-12"
            />

            <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1"
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
                            className="relative block cursor-pointer group w-full animate-levitate h-80"
                            style={{ animationDelay: index === 1 ? '1s' : '0s' }}
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
                                    <p className="text-[14px] text-neutral-400 leading-relaxed max-w-50 relative z-10 font-space mb-6">
                                        {option.subtitle}
                                    </p>
                                </div>

                                <div className="absolute -top-16 right-0 sm:bottom-6 sm:right-6 w-55 h-55 scale-[0.65] sm:scale-[0.8] origin-bottom-right [perspective:1000px] flex items-center justify-center pointer-events-none z-0">
                                    <div className="flex [transform:rotateX(12deg)] transition-transform duration-500 w-full h-full pointer-events-auto relative items-center justify-center">
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
                                            option.theme.centerNodeBorder,
                                            option.theme.centerNodeBorderHover
                                        )}>
                                            <div className={cn(
                                                "absolute w-[128px] h-[128px] blur-[40px] rounded-full pointer-events-none",
                                                option.theme.bgSelectedShadow
                                            )}></div>
                                            <div className={cn(
                                                "absolute inset-0 rounded-lg transition-shadow duration-300 pointer-events-none",
                                                option.theme.centerNodeShadow,
                                                option.theme.centerNodeGlow
                                            )}></div>
                                            <Icon icon={option.centerIcon} className={cn("text-[12px] relative z-10", option.theme.iconText)} />
                                        </div>

                                        {option.tags.map((tag, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300",
                                                    tag.position
                                                )}
                                            >
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md border border-neutral-800 shadow-xl transition-all duration-300">
                                                    <Icon icon={tag.icon} className={cn("text-base", tag.iconClass)} />
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
