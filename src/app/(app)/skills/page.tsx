import { SkillsHeader } from "@/components/dashboard/skills/SkillsHeader";
import { SkillsGrid } from "@/components/dashboard/skills/SkillsGrid";

export const metadata = {
    title: "Skills | SwiftClaw",
    description: "Manage agent skills",
};

export default function SkillsPage() {
    return (
        <main className="flex-1 flex flex-col bg-transparent relative min-w-0 h-full">
            <SkillsHeader />
            <SkillsGrid />
        </main>
    );
}
