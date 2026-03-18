import { SkillsPageClient } from "@/components/dashboard/skills/SkillsPageClient";

export const metadata = {
    title: "Skills | SwiftClaw",
    description: "Manage agent skills and define custom workflows.",
};

export default function SkillsPage() {
    return (
        <main className="flex-1 flex flex-col bg-transparent relative min-w-0 h-full">
            <SkillsPageClient />
        </main>
    );
}
