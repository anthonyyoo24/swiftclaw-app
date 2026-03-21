import { TaskColumn } from "./TaskColumn";
import { TaskCard, type TaskCardProps } from "./TaskCard";

interface ColumnData {
    title: string;
    isDimmed?: boolean;
    cards: TaskCardProps[];
}

const COLUMNS: ColumnData[] = [
    {
        title: "Inbox",
        cards: [
            {
                tagLabel: "Bug",
                tagColor: "red",
                title: "Fix login authentication bypass",
                date: "Oct 14",
                comments: 0,
                assigneeIcon: "lucide:user",
                assigneeColor: "neutral",
                hasOptions: true,
            },
            {
                tagLabel: "Feature",
                tagColor: "blue",
                title: "Add dark mode toggle",
                date: "Oct 13",
                comments: 3,
                assigneeIcon: "lucide:user",
                assigneeColor: "neutral",
            },
        ],
    },
    {
        title: "Assigned",
        cards: [
            {
                tagLabel: "Update",
                tagColor: "purple",
                title: "Update dependency packages",
                date: "Oct 12",
                assigneeIcon: "lucide:bot",
                assigneeColor: "blue",
            },
        ],
    },
    {
        title: "In Progress",
        cards: [
            {
                tagLabel: "DevOps",
                tagColor: "orange",
                title: "Orchestrating deployment pipeline",
                date: "Oct 11",
                assigneeIcon: "lucide:bot",
                assigneeColor: "blue",
            },
            {
                tagLabel: "Feature",
                tagColor: "blue",
                title: "Implement Kanban board",
                date: "Oct 10",
                assigneeIcon: "lucide:code-2",
                assigneeColor: "purple",
            },
        ],
    },
    {
        title: "Review",
        cards: [
            {
                tagLabel: "Copy",
                tagColor: "emerald",
                title: "Landing Page Copy v2",
                date: "Oct 09",
                assigneeIcon: "lucide:pen-tool",
                assigneeColor: "orange",
            },
        ],
    },
    {
        title: "Done",
        isDimmed: true,
        cards: [
            {
                tagLabel: "Setup",
                tagColor: "neutral",
                title: "Initial repository setup",
                date: "Oct 05",
                assigneeIcon: "lucide:bot",
                assigneeColor: "blue",
                isDone: true,
            },
        ],
    },
];

/**
 * TaskBoard component that renders a kanban-style board with task columns and cards.
 * Uses a data-driven approach to map over predefined column and task data.
 */
export function TaskBoard() {
    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-[10.7px]">
            <div className="flex gap-[10.7px] h-full min-w-max md:w-full pb-2">
                {COLUMNS.map((column) => (
                    <TaskColumn
                        key={column.title}
                        title={column.title}
                        count={column.cards.length}
                        isDimmed={column.isDimmed}
                    >
                        {column.cards.map((card, index) => (
                            <TaskCard key={`${column.title}-${index}`} {...card} />
                        ))}
                    </TaskColumn>
                ))}
            </div>
        </div>
    );
}
