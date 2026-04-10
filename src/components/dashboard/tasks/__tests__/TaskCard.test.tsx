// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../TaskCard';
import { Doc } from "@convex/_generated/dataModel";

const mockRemoveTask = vi.fn();
vi.mock("convex/react", () => ({
    useMutation: () => mockRemoveTask,
}));

// Mock iconify since it might complain about missing icons in jsdom if not loaded
vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" title={props.title || props.icon} {...props} />
}));

describe('TaskCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockTask: Doc<"tasks"> = {
        _id: "test_task_id" as any,
        _creationTime: Date.now(),
        title: "Test Task 1",
        description: "",
        status: "inbox",
        assigneeIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    it('renders the task title and status tag', () => {
        render(<TaskCard task={mockTask} onClick={vi.fn()} />);
        expect(screen.getByText("Test Task 1")).toBeInTheDocument();
        expect(screen.getByText("Inbox")).toBeInTheDocument();
    });

    it('calls onClick when clicking the card', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<TaskCard task={mockTask} onClick={onClick} />);
        
        const textElement = screen.getByText("Test Task 1");
        // Click the parent div. The text is inside the div.
        await user.click(textElement);
        expect(onClick).toHaveBeenCalled();
    });

    it('calls remove mutation when clicking the delete button and stops propagation', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<TaskCard task={mockTask} onClick={onClick} />);
        
        const removeButton = screen.getByRole("button", { name: /Remove task/i });
        await user.click(removeButton);
        
        expect(mockRemoveTask).toHaveBeenCalledWith({ id: "test_task_id" });
        expect(onClick).not.toHaveBeenCalled();
    });
});
