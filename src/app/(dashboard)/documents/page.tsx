import { DocumentsPageClient } from "@/components/dashboard/documents/DocumentsPageClient";

export const metadata = {
    title: "Documents | SwiftClaw",
    description: "View agent-authored deliverables and research documents.",
};

export default function DocumentsPage() {
    return (
        <main className="flex-1 flex flex-col bg-transparent relative min-w-0 h-full">
            <DocumentsPageClient />
        </main>
    );
}
