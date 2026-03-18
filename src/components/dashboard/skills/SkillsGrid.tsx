import { Icon } from "@iconify/react";
import { SkillCard, Skill } from "./SkillCard";

export const MOCK_SKILLS: Skill[] = [
    {
        id: "1",
        title: "Web Browsing",
        description: "Allows the agent to search the internet for real-time information and current events.",
        icon: "lucide:globe",
        type: "Default",
        status: "Active",
        theme: "blue",
    },
    {
        id: "2",
        title: "Code Interpreter",
        description: "Execute Python code in a secure sandboxed environment to perform data analysis or calculations.",
        icon: "lucide:terminal-square",
        type: "Default",
        status: "Active",
        theme: "orange",
    },
    {
        id: "3",
        title: "Document Reader",
        description: "Extract and read text from PDF, DOCX, CSV, and plain text files uploaded to the workspace.",
        icon: "lucide:file-text",
        type: "Default",
        status: "Disabled",
        theme: "emerald",
    },
    {
        id: "4",
        title: "PostgreSQL Query",
        description: "Connects to the internal database to run read-only analytical queries for generating reports.",
        icon: "lucide:database",
        type: "Custom",
        status: "Active",
        theme: "purple",
    },
    {
        id: "5",
        title: "SendGrid Emailer",
        description: "Dispatch automated email reports and notifications directly to the team via SendGrid API.",
        icon: "lucide:mail",
        type: "Custom",
        status: "Active",
        theme: "pink",
    },
];

export function SkillsGrid() {
    return (
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-10">
                {MOCK_SKILLS.map((skill) => (
                    <SkillCard key={skill.id} skill={skill} />
                ))}

                {/* Create New Skill Card */}
                <button className="p-5 bg-transparent cursor-pointer border border-dashed border-white/10 rounded-2xl hover:bg-white/[0.02] hover:border-white/20 transition-all flex flex-col items-center justify-center min-h-[220px] gap-3 group h-full">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-white/10 transition-colors shadow-sm">
                        <Icon icon="lucide:plus" className="text-xl" />
                    </div>
                    <div className="text-center mt-2">
                        <span className="block text-sm font-semibold text-white tracking-tight mb-1">
                            Create Custom Skill
                        </span>
                        <span className="block text-xs text-neutral-500">
                            Define a new tool via API or function
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}
