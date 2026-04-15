"use client";

import { Icon } from "@iconify/react";
import { Doc, Id } from "@convex/_generated/dataModel";
import { DocumentCard } from "./DocumentCard";

type DocType = "deliverable" | "research" | "protocol" | "general";
type TypeFilter = "all" | DocType;

const FILTER_TABS: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "deliverable", label: "Deliverable" },
    { value: "research", label: "Research" },
    { value: "protocol", label: "Protocol" },
    { value: "general", label: "General" },
];

interface DocumentsListProps {
    documents: Doc<"documents">[];
    agentMap: Record<Id<"agents">, Doc<"agents">>;
    selectedId: Id<"documents"> | null;
    onSelect: (id: Id<"documents">) => void;
    typeFilter: TypeFilter;
    onTypeFilterChange: (filter: TypeFilter) => void;
}

export function DocumentsList({
    documents,
    agentMap,
    selectedId,
    onSelect,
    typeFilter,
    onTypeFilterChange,
}: DocumentsListProps) {
    return (
        <div className="w-[280px] shrink-0 border-r border-white/5 flex flex-col h-full">
            {/* Type filter tabs */}
            <div className="px-3 pt-3 pb-2 border-b border-white/5 flex flex-wrap gap-1">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => onTypeFilterChange(tab.value)}
                        className={`text-[11px] px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                            typeFilter === tab.value
                                ? "bg-white/10 text-white"
                                : "text-neutral-500 hover:text-neutral-300"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Icon icon="lucide:file-text" className="text-2xl text-neutral-700 mb-2" />
                        <p className="text-xs text-neutral-600">No documents yet.</p>
                        <p className="text-[11px] text-neutral-700 mt-0.5">
                            Agents will publish documents here.
                        </p>
                    </div>
                ) : (
                    documents.map((doc) => (
                        <DocumentCard
                            key={doc._id}
                            document={doc}
                            agentMap={agentMap}
                            isSelected={selectedId === doc._id}
                            onClick={() => onSelect(doc._id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
