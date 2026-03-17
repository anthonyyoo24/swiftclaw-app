import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";

export function TaskBoard() {
    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-[10.7px]">
            <div className="flex gap-[10.7px] h-full min-w-max md:w-full pb-2">
                {/* Column 1: Inbox */}
                <TaskColumn title="Inbox" count={2}>
                    <TaskCard
                        tagLabel="Bug"
                        tagColor="red"
                        title="Fix login authentication bypass"
                        date="Oct 14"
                        comments={0}
                        assigneeIcon="lucide:user"
                        assigneeColor="neutral"
                        hasOptions={true}
                    />
                    <TaskCard
                        tagLabel="Feature"
                        tagColor="blue"
                        title="Add dark mode toggle"
                        date="Oct 13"
                        comments={3}
                        assigneeIcon="lucide:user"
                        assigneeColor="neutral"
                    />
                </TaskColumn>

                {/* Column 2: Assigned */}
                <TaskColumn title="Assigned" count={1}>
                    <TaskCard
                        tagLabel="Update"
                        tagColor="purple"
                        title="Update dependency packages"
                        date="Oct 12"
                        assigneeIcon="lucide:bot"
                        assigneeColor="blue"
                    />
                </TaskColumn>

                {/* Column 3: In Progress */}
                <TaskColumn title="In Progress" count={2}>
                    <TaskCard
                        tagLabel="DevOps"
                        tagColor="orange"
                        title="Orchestrating deployment pipeline"
                        date="Oct 11"
                        assigneeIcon="lucide:bot"
                        assigneeColor="blue"
                    />
                    <TaskCard
                        tagLabel="Feature"
                        tagColor="blue"
                        title="Implement Kanban board"
                        date="Oct 10"
                        assigneeIcon="lucide:code-2"
                        assigneeColor="purple"
                    />
                </TaskColumn>

                {/* Column 4: Review */}
                <TaskColumn title="Review" count={1}>
                    <TaskCard
                        tagLabel="Copy"
                        tagColor="emerald"
                        title="Landing Page Copy v2"
                        date="Oct 09"
                        assigneeIcon="lucide:pen-tool"
                        assigneeColor="orange"
                    />
                </TaskColumn>

                {/* Column 5: Done */}
                <TaskColumn title="Done" count={1} isDimmed={true}>
                    <TaskCard
                        tagLabel="Setup"
                        tagColor="neutral"
                        title="Initial repository setup"
                        date="Oct 05"
                        assigneeIcon="lucide:bot"
                        assigneeColor="blue"
                        isDone={true}
                    />
                </TaskColumn>
            </div>
        </div>
    );
}
