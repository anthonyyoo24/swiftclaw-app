"use client";

import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { DocumentsList } from "./DocumentsList";
import { DocumentViewer } from "./DocumentViewer";

type DocType = "deliverable" | "research" | "protocol" | "general";
type TypeFilter = "all" | DocType;

export function DocumentsPageClient() {
    const [selectedId, setSelectedId] = useState<Id<"documents"> | null>(null);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

    const documents = useQuery(api.documents.list, {});
    const agents = useQuery(api.agents.get, {});
    const removeDocument = useMutation(api.documents.remove);

    const agentMap = useMemo(() => {
        const map: Record<Id<"agents">, Doc<"agents">> = {} as Record<Id<"agents">, Doc<"agents">>;
        if (!agents) return map;
        for (const agent of agents) {
            map[agent._id] = agent;
        }
        return map;
    }, [agents]);

    const filteredDocuments = useMemo(() => {
        if (!documents) return [];
        return typeFilter === "all"
            ? documents
            : documents.filter((d) => d.type === typeFilter);
    }, [documents, typeFilter]);

    const selectedDoc = documents?.find((d) => d._id === selectedId) ?? null;

    // If the selected doc got filtered out or removed, clear selection
    const visibleSelectedDoc =
        selectedDoc && (typeFilter === "all" || selectedDoc.type === typeFilter)
            ? selectedDoc
            : null;

    function handleSelect(id: Id<"documents">) {
        setSelectedId(id);
    }

    function handleDelete(id: Id<"documents">) {
        removeDocument({ id });
        if (selectedId === id) setSelectedId(null);
    }

    return (
        <>
            {/* Header */}
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-white/1 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-white tracking-tight">Documents</h3>
                    {(documents?.length ?? 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-neutral-400">
                            {documents?.length}
                        </span>
                    )}
                </div>
            </header>

            {/* Two-pane body */}
            <div className="flex flex-1 overflow-hidden">
                <DocumentsList
                    documents={filteredDocuments}
                    agentMap={agentMap}
                    selectedId={visibleSelectedDoc?._id ?? null}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    typeFilter={typeFilter}
                    onTypeFilterChange={(f) => {
                        setTypeFilter(f);
                    }}
                />

                {visibleSelectedDoc ? (
                    <DocumentViewer document={visibleSelectedDoc} agentMap={agentMap} onDelete={() => handleDelete(visibleSelectedDoc._id)} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                            <Icon icon="lucide:file-text" className="text-2xl text-neutral-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500">No document selected</p>
                            <p className="text-xs text-neutral-700 mt-0.5">
                                Pick a document from the list to read it here.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
