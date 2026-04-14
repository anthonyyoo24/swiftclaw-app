// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

    it('applies exit animation class when X button is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<TaskDetailPanel task={mockTask} onClose={vi.fn()} />);

        const panel = container.firstChild as HTMLElement;
        expect(panel.className).toContain('slide-in-from-right');

        // The X close button is the first button in the panel (before Cancel Task)
        const closeButton = screen.getAllByRole("button")[0];
        await user.click(closeButton);

        expect(panel.className).toContain('slide-out-to-right');
    });

    it('calls remove mutation and triggers close animation when Cancel Task is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<TaskDetailPanel task={mockTask} onClose={vi.fn()} />);

        const cancelBtn = screen.getByRole("button", { name: /Cancel Task/i });
        await user.click(cancelBtn);

        expect(mockRemoveTask).toHaveBeenCalledWith({ id: "test_task_id" });
        const panel = container.firstChild as HTMLElement;
        expect(panel.className).toContain('slide-out-to-right');
    });

    it('hides Cancel Task button when task status is done', () => {
        const doneTask: Doc<"tasks"> = { ...mockTask, status: "done" };
        render(<TaskDetailPanel task={doneTask} onClose={vi.fn()} />);
        expect(screen.queryByRole("button", { name: /Cancel Task/i })).not.toBeInTheDocument();
    });

    it('does not call onClose immediately when X is clicked — waits for exit animation', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<TaskDetailPanel task={mockTask} onClose={onClose} />);

        const closeButton = screen.getAllByRole("button")[0];
        await user.click(closeButton);

        // onClose is wired to onAnimationEnd, so it must NOT be called
        // until the CSS exit animation completes (happens in the browser,
        // not in jsdom — this asserts the panel doesn't close eagerly)
        expect(onClose).not.toHaveBeenCalled();
    });
});
