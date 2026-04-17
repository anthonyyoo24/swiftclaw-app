"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Doc, Id } from "@convex/_generated/dataModel";
import { AGENT_ROLES } from "@/constants/ai-core";
import { DeleteDocumentDialog } from "./DeleteDocumentDialog";

type DocType = "deliverable" | "research" | "protocol" | "general";

const TYPE_BADGE: Record<DocType, { label: string; className: string }> = {
    deliverable: {
        label: "Deliverable",
        className: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    },
    research: {
        label: "Research",
        className: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
    },
    protocol: {
        label: "Protocol",
        className: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    },
    general: {
        label: "General",
        className: "bg-white/10 text-neutral-400 border border-white/10",
    },
};

function formatRelativeDate(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DocumentCardProps {
    document: Doc<"documents">;
    agentMap: Record<Id<"agents">, Doc<"agents">>;
    isSelected: boolean;
    onClick: () => void;
    onDelete: () => void;
}

export function DocumentCard({ document, agentMap, isSelected, onClick, onDelete }: DocumentCardProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const badge = TYPE_BADGE[document.type];
    const agent = agentMap[document.createdById];
    const avatarSrc = agent ? AGENT_ROLES[agent.name]?.avatar : undefined;

    return (
        <>
            <button
                type="button"
                onClick={onClick}
                className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col gap-2 ${
                    isSelected
                        ? "bg-blue-500/5 border-blue-500/40"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                }`}
            >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-white leading-snug line-clamp-2 min-w-0">
                        {document.title}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
                        className="text-neutral-600 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer shrink-0"
                        title="Delete document"
                    >
                        <Icon icon="lucide:x" className="text-[16px]" />
                    </button>
                </div>

                {/* Badge + meta row */}
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${badge.className}`}>
                        {badge.label}
                    </span>

                    <div className="flex items-center gap-1.5 min-w-0">
                        {/* Agent avatar */}
                        {avatarSrc ? (
                            <div className="relative w-4 h-4 shrink-0">
                                <Image
                                    src={avatarSrc}
                                    alt={agent?.name ?? ""}
                                    fill
                                    className="object-cover rounded-full"
                                />
                            </div>
                        ) : (
                            <div className="w-4 h-4 shrink-0 flex items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
                                <Icon icon="lucide:bot" className="text-[8px] text-blue-400" />
                            </div>
                        )}
                        <span className="text-[10px] text-neutral-500 truncate">
                            {formatRelativeDate(document.createdAt)}
                        </span>
                    </div>
                </div>
            </button>

            <DeleteDocumentDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                documentTitle={document.title}
                onConfirm={onDelete}
            />
        </>
    );
}
