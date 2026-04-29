import fs from "fs";
import path from "path";
import { ActivityFeed } from "@/components/dashboard/home/ActivityFeed";
import { AgentStatus } from "@/components/dashboard/home/AgentStatus";

export function loadRoleEmojis(
    dir = path.join(process.cwd(), "resources/soul-templates")
): Record<string, string> {
    const emojis: Record<string, string> = {};
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".md")) continue;
        const content = fs.readFileSync(path.join(dir, file), "utf8");
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match) continue;
        const role = match[1].match(/^role:\s*(.+)$/m)?.[1]?.trim();
        const emoji = match[1].match(/^emoji:\s*(.+)$/m)?.[1]?.trim();
        if (role && emoji) emojis[role] = emoji;
    }
    return emojis;
}

export default function HomePage() {
    const roleEmojis = loadRoleEmojis();
    return (
        <>
            <AgentStatus roleEmojis={roleEmojis} />
            <ActivityFeed />
        </>
    );
}
