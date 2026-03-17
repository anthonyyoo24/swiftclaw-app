import { TasksHeader } from "@/components/dashboard/tasks/TasksHeader";
import { TaskBoard } from "@/components/dashboard/tasks/TaskBoard";

export default function TasksPage() {
    return (
        <main className="flex-1 flex flex-col bg-transparent relative min-w-0 h-full">
            <TasksHeader />
            <TaskBoard />
        </main>
    );
}
