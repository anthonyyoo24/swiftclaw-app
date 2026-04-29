// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskDetailPanel } from '../TaskDetailPanel';
import { Doc } from "@convex/_generated/dataModel";

let mockMessagesQueryResponse: any[] | null | undefined;
const mockRemoveTask = vi.fn();

vi.mock("convex/react", () => ({
    useQuery: () => mockMessagesQueryResponse,
    useMutation: () => mockRemoveTask,
}));

vi.mock("@convex/_generated/api", () => ({
    api: {
        tasks: { remove: "api.tasks.remove" },
        taskMessages: { listByTask: "api.taskMessages.listByTask" },
    }
}));

vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" {...props} />
}));

const mockTask: Doc<"tasks"> = {
    _id: "test_task_id" as any,
    _creationTime: Date.now(),
    title: "Test Task",
    description: "A test description",
    status: "inbox",
    assigneeIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

describe('TaskDetailPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMessagesQueryResponse = [];
    });

    it('renders task title and description', () => {
        render(<TaskDetailPanel task={mockTask} onClose={vi.fn()} />);
        expect(screen.getByText("Test Task")).toBeInTheDocument();
        expect(screen.getByText("A test description")).toBeInTheDocument();
    });

    it('shows empty state when messages is undefined (loading)', () => {
        mockMessagesQueryResponse = undefined;
        render(<TaskDetailPanel task={mockTask} onClose={vi.fn()} />);
        expect(screen.getByText("No messages yet.")).toBeInTheDocument();
    });

    it('shows empty state when messages is null', () => {
        mockMessagesQueryResponse = null;
        render(<TaskDetailPanel task={mockTask} onClose={vi.fn()} />);
        expect(screen.getByText("No messages yet.")).toBeInTheDocument();
    });

    it('shows empty state when messages is an empty array', () => {
        mockMessagesQueryResponse = [];
        render(<TaskDetailPanel task={mockTask} onClose={vi.fn()} />);
        expect(screen.getByText("No messages yet.")).toBeInTheDocument();
    });

    it('renders messages when present', () => {
        mockMessagesQueryResponse = [
            {
                _id: "msg_1" as any,
                content: "Agent started working",
                createdAt: Date.now(),
            }
        ];
        render(<TaskDetailPanel task={mockTask} onClose={vi.fn()} />);
        expect(screen.getByText("Agent started working")).toBeInTheDocument();
    });

    it('hides Cancel Task button when task status is done', () => {
        const doneTask: Doc<"tasks"> = { ...mockTask, status: "done" };
        render(<TaskDetailPanel task={doneTask} onClose={vi.fn()} />);
        expect(screen.queryByRole("button", { name: /Cancel Task/i })).not.toBeInTheDocument();
    });
});
