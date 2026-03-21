"use client";

import { AgentTemplateId } from "../schema";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";
import { useWizardField } from "../hooks/useWizardField";

export interface Template {
    id: AgentTemplateId;
    title: string;
    role: string;
    description: string;
    emoji: string;
    color: string;
    avatar?: string;
}

export const TEMPLATES: Template[] = [
    {
        id: "maya",
        title: "Maya",
        role: "Customer support specialist",
        description: "Handles customer issues with patience and care. Warm, reassuring, and talks to you like a friend.",
        emoji: "🎧",
        color: "from-blue-500/20 to-cyan-500/20",
        avatar: "/avatars/maya-customer-support.png",
    },
    {
        id: "jack",
        title: "Jack",
        role: "Sales representative",
        description: "Qualifies leads and books meetings so you can focus on closing. Bold, playful, and never runs out of energy.",
        emoji: "💼",
        color: "from-indigo-500/20 to-blue-500/20",
        avatar: "/avatars/jack-sales-rep.png",
    },
    {
        id: "lily",
        title: "Lily",
        role: "Content writer",
        description: "Writes blogs, social posts, and marketing content. Creative, witty, and speaks in stories.",
        emoji: "✍️",
        color: "from-purple-500/20 to-fuchsia-500/20",
        avatar: "/avatars/lily-content-writer.png",
    },
    {
        id: "max",
        title: "Max",
        role: "Research analyst",
        description: "Researches competitors, trends, and insights. Calm, curious, and has dry one-liners ready.",
        emoji: "🔍",
        color: "from-emerald-500/20 to-teal-500/20",
        avatar: "/avatars/max-research-analyst.png",
    },
    {
        id: "sarah",
        title: "Sarah",
        role: "Product manager",
        description: "Prioritizes what to build and keeps the team aligned. Decisive, practical, and makes scope creep jokes.",
        emoji: "📊",
        color: "from-rose-500/20 to-orange-500/20",
        avatar: "/avatars/sarah-product-manager.png",
    },
    {
        id: "emma",
        title: "Emma",
        role: "Administrative assistant",
        description: "Handles all administrative and manual tasks. Calm, reliable, and always knows what you need before you ask.",
        emoji: "📋",
        color: "from-amber-500/20 to-yellow-500/20",
        avatar: "/avatars/emma-admin-assistant.png",
    },
    {
        id: "chris",
        title: "Chris",
        role: "QA engineer",
        description: "Tests your app so you don't have to. Detail-obsessed, deadpan humor, and finds bugs you didn't know existed.",
        emoji: "🪲",
        color: "from-green-500/20 to-emerald-500/20",
        avatar: "/avatars/chris-qa-engineer.png",
    },
    {
        id: "kevin",
        title: "Kevin",
        role: "Software engineer",
        description: "Writes code and ships features. Chill, pragmatic, and keeps it real.",
        emoji: "💻",
        color: "from-slate-500/20 to-gray-500/20",
        avatar: "/avatars/kevin-software-engineer.png",
    },
    {
        id: "zoe",
        title: "Zoe",
        role: "UI/UX designer",
        description: "Designs interfaces users actually want to use. Creative, visual humor, and describes things in metaphors.",
        emoji: "✨",
        color: "from-pink-500/20 to-rose-500/20",
        avatar: "/avatars/zoe-designer.png",
    },
];

const SARAH_ID: AgentTemplateId = "sarah";

interface CharacterSelectionViewProps {
    recommendedTemplates: AgentTemplateId[];
    otherTemplates: AgentTemplateId[];
}

interface TemplateCardProps {
    template: Template;
    isSelected: boolean;
    onSelect: (id: AgentTemplateId) => void;
}

const TemplateCard = ({ template, isSelected, onSelect }: TemplateCardProps) => (
    <button
        onClick={() => onSelect(template.id)}
        type="button"
        aria-pressed={isSelected}
        className={cn(
            "relative group text-left px-6 py-5 rounded-2xl border cursor-pointer transition-all duration-200",
            "hover:-translate-y-1 hover:shadow-lg flex flex-col h-full",
            isSelected
                ? "bg-white/5 border-white shadow-md shadow-white/5"
                : "bg-white/5 border-white/10 hover:border-white/30"
        )}
    >
        {/* Gradient overlay */}
        <div className={cn(
            "absolute inset-0 rounded-2xl bg-linear-to-br opacity-0 transition-opacity duration-300 pointer-events-none",
            template.color,
            isSelected ? "opacity-100" : "group-hover:opacity-100"
        )} />

        <div className="relative flex items-start gap-4 mt-1">
            <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl text-2xl transition-transform duration-300 relative overflow-hidden shrink-0",
                isSelected ? "bg-white/20 scale-110" : "bg-white/10 group-hover:bg-white/20 group-hover:scale-110"
            )}>
                {template.avatar ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={template.avatar}
                            alt={template.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                        />
                    </div>
                ) : (
                    template.emoji
                )}
            </div>
            <div className="flex-1 space-y-1 text-left flex flex-col items-start">
                <div className="flex items-center justify-between w-full">
                    <h3 className="font-semibold text-white tracking-tight">{template.title}</h3>
                </div>
                <p className="text-[11px] text-indigo-300/80 font-semibold tracking-wide uppercase mb-0.5 leading-tight">{template.role}</p>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                    {template.description}
                </p>
            </div>
        </div>
    </button>
);

interface SarahLeadCardProps {
    template: Template;
}

const SarahLeadCard = ({ template }: SarahLeadCardProps) => (
    <div className="relative group text-left px-6 py-5 rounded-2xl flex flex-col w-full h-full"
        style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,146,60,0.08) 100%)",
            border: "1px solid",
            borderImageSlice: 1,
        }}
    >
        {/* Gold/amber gradient border via box-shadow + outline trick */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
                boxShadow: "0 0 0 1.5px rgba(251,191,36,0.45), 0 0 18px 2px rgba(251,191,36,0.10)",
            }}
        />

        {/* Subtle warm gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-amber-500/10 to-orange-500/10 pointer-events-none" />

        {/* Crown badge */}
        <div className="absolute -top-3 left-6 px-3 py-1 rounded-full shadow-lg border border-amber-400/30 flex items-center gap-1.5 z-10"
            style={{ background: "linear-gradient(90deg, #b45309 0%, #d97706 50%, #f59e0b 100%)" }}
        >
            <span className="text-[10px]">👑</span>
            <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">Lead Agent</span>
        </div>

        <div className="relative flex items-start gap-4 mt-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl relative overflow-hidden shrink-0 bg-amber-500/20">
                {template.avatar ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={template.avatar}
                            alt={template.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                        />
                    </div>
                ) : (
                    template.emoji
                )}
            </div>
            <div className="flex-1 space-y-1 text-left flex flex-col items-start">
                <div className="flex items-center justify-between w-full">
                    <h3 className="font-semibold text-white tracking-tight">{template.title}</h3>
                </div>
                <p className="text-[11px] text-amber-400/90 font-semibold tracking-wide uppercase mb-0.5 leading-tight">{template.role}</p>
                <p className="text-sm text-neutral-400">
                    {template.description}
                </p>
            </div>
        </div>
    </div>
);

export function CharacterSelectionView({
    recommendedTemplates,
    otherTemplates,
}: CharacterSelectionViewProps) {
    const { value: rawValue, onChange } = useWizardField("agentTemplateIds");
    const selectedTemplateIds = (rawValue as AgentTemplateId[]) || [];

    const sarahTemplate = TEMPLATES.find(t => t.id === SARAH_ID);

    if (!sarahTemplate) {
        console.error(`Lead agent template with ID "${SARAH_ID}" not found.`);
        return null;
    }

    // Filter out Sarah and combine all other team agents into a single list
    const teamAgents = [...recommendedTemplates, ...otherTemplates]
        .filter(id => id !== SARAH_ID)
        // Deduplicate in case any appear in both lists
        .filter((id, index, self) => self.indexOf(id) === index);

    const handleSelect = (id: AgentTemplateId) => {
        const next = selectedTemplateIds.includes(id)
            ? selectedTemplateIds.filter(tId => tId !== id)
            : [...selectedTemplateIds, id];

        // Ensure Sarah (Lead Agent) is always included if she was already there
        // or if she's expected to be permanent.
        if (selectedTemplateIds.includes(SARAH_ID) && !next.includes(SARAH_ID)) {
            next.push(SARAH_ID);
        }

        onChange(next);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                title="Meet Your Team"
                description="Sarah is your lead agent and the only one you'll need to communicate with. She'll manage your team and delegate tasks based on your needs."
                icon="lucide:bot"
            />

            {/* Sarah — Lead Agent (Centered & Same Width as Grid Items) */}
            <div className="space-y-4">
                <div className="w-full flex justify-center">
                    <div className="w-full md:w-[calc(50%-0.5rem)]">
                        <SarahLeadCard template={sarahTemplate} />
                    </div>
                </div>
            </div>

            {/* Team Agents — Unified Selectable Grid */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="px-1 text-center md:text-left">
                    <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Build Your Team</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamAgents.map(id => {
                        const template = TEMPLATES.find(t => t.id === id);
                        if (!template) return null;
                        return (
                            <TemplateCard
                                key={id}
                                template={template}
                                isSelected={selectedTemplateIds.includes(id)}
                                onSelect={handleSelect}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
