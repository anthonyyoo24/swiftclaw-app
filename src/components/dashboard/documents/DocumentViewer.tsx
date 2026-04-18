"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Doc, Id } from "@convex/_generated/dataModel";
import { AGENT_ROLES } from "@/constants/ai-core";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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

const proseComponents: Components = {
    h1: ({ children }) => (
        <h1 className="text-xl font-bold text-white mt-6 mb-3 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-base font-semibold text-white mt-5 mb-2 pb-1 border-b border-white/5 first:mt-0">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-sm font-semibold text-white mt-4 mb-1.5 first:mt-0">{children}</h3>
    ),
    p: ({ children }) => (
        <p className="text-sm text-neutral-300 leading-relaxed mb-3">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="text-sm text-neutral-300 list-disc list-inside mb-3 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="text-sm text-neutral-300 list-decimal list-inside mb-3 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="text-sm text-neutral-300">{children}</li>,
    code: ({ children, className }) => {
        const isBlock = className?.startsWith("language-");
        if (isBlock) {
            return (
                <code className="block text-xs font-mono text-neutral-200 whitespace-pre-wrap break-words">
                    {children}
                </code>
            );
        }
        return (
            <code className="bg-white/10 text-blue-300 text-xs font-mono px-1.5 py-0.5 rounded">
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-white/5 border border-white/10 rounded-xl p-4 overflow-x-auto mb-3 no-scrollbar">
            {children}
        </pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-white/20 pl-4 text-neutral-400 italic my-3">
            {children}
        </blockquote>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
        >
            {children}
        </a>
    ),
    hr: () => <hr className="border-white/10 my-4" />,
    table: ({ children }) => (
        <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse">{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className="text-xs font-semibold text-neutral-400 text-left p-2 border-b border-white/10">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="text-sm text-neutral-300 p-2 border-b border-white/5">{children}</td>
    ),
    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
    em: ({ children }) => <em className="text-neutral-300 italic">{children}</em>,
};

interface DocumentViewerProps {
    document: Doc<"documents">;
    agentMap: Record<Id<"agents">, Doc<"agents">>;
    onDelete: () => void;
}

export function DocumentViewer({ document, agentMap, onDelete }: DocumentViewerProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const badge = TYPE_BADGE[document.type];
    const agent = agentMap[document.createdById];
    const avatarSrc = agent ? AGENT_ROLES[agent.name]?.avatar : undefined;
    const agentLabel = agent
        ? agent.name.charAt(0).toUpperCase() + agent.name.slice(1)
        : "Unknown agent";

    const date = new Date(document.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Document header */}
            <div className="px-6 py-4 border-b border-white/5 shrink-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <h1 className="text-base font-semibold text-white leading-snug">
                        {document.title}
                    </h1>
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        className="mt-0.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors border border-red-500/20 shrink-0"
                        title="Delete document"
                    >
                        <Icon icon="lucide:trash-2" className="text-sm" />
                        Delete
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Type badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                    </span>

                    {/* Divider */}
                    <span className="text-neutral-700">·</span>

                    {/* Agent */}
                    <div className="flex items-center gap-1.5">
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
                        <span className="text-neutral-400">{agentLabel}</span>
                    </div>

                    {/* Divider */}
                    <span className="text-neutral-700">·</span>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-neutral-500">
                        <Icon icon="lucide:calendar" className="text-[10px]" />
                        <span>{date}</span>
                    </div>

                    {/* Linked task chip */}
                    {document.taskId && (
                        <>
                            <span className="text-neutral-700">·</span>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-500">
                                <Icon icon="lucide:link" className="text-[9px]" />
                                <span className="text-[10px]">Linked task</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Markdown content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 no-scrollbar">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={proseComponents}>
                    {document.content}
                </ReactMarkdown>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete document?"
                description={`"${document.title}" will be permanently deleted. This action cannot be undone.`}
                onConfirm={onDelete}
            />
        </div>
    );
}
