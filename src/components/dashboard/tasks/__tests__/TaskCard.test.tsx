// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../TaskCard';
import { Doc, Id } from "@convex/_generated/dataModel";

const mockRemoveTask = vi.fn();
vi.mock("convex/react", () => ({
    useMutation: () => mockRemoveTask,
}));

vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" title={props.title || props.icon} {...props} />
}));

vi.mock("next/image", () => ({
    default: (props: any) => <img {...props} />,
}));

describe('TaskCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const userId = "user_1" as Id<"users">;

    const mockTask: Doc<"tasks"> = {
        _id: "test_task_id" as any,
        _creationTime: Date.now(),
        title: "Test Task 1",
        description: "",
        status: "inbox",
        assigneeIds: [],
        userId,
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

    // Agent avatar display tests
    it('shows default bot icon when task has no assignees', () => {
        render(<TaskCard task={mockTask} onClick={vi.fn()} agentMap={{}} />);
        // The mock renders Icon as <span title={icon} ...>, so query by the icon name
        expect(screen.getByTitle("lucide:bot")).toBeInTheDocument();
    });

    it('shows agent initial when agent has no avatar', () => {
        const agentId = "agent_1" as any;
        const agentMap: Record<string, Doc<"agents">> = {
            agent_1: {
                _id: agentId,
                _creationTime: Date.now(),
                name: "Zara",
                role: "agent",
                sessionKey: "key-1",
                status: "active",
                userId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
        };
        const taskWithAssignee: Doc<"tasks"> = { ...mockTask, assigneeIds: [agentId] };

        render(<TaskCard task={taskWithAssignee} onClick={vi.fn()} agentMap={agentMap} />);
        expect(screen.getByText("Z")).toBeInTheDocument();
    });

    it('renders an img when agent name matches an AGENT_ROLES avatar', () => {
        const agentId = "agent_maya" as any;
        const agentMap: Record<string, Doc<"agents">> = {
            agent_maya: {
                _id: agentId,
                _creationTime: Date.now(),
                name: "maya",
                role: "agent",
                sessionKey: "key-maya",
                status: "active",
                userId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
        };
        const taskWithAssignee: Doc<"tasks"> = { ...mockTask, assigneeIds: [agentId] };

        render(<TaskCard task={taskWithAssignee} onClick={vi.fn()} agentMap={agentMap} />);
        const img = screen.getByRole("img", { name: /maya/i });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "/avatars/maya-customer-support.png");
    });

    it('shows at most 2 assignee avatars', () => {
        const ids = ["a1", "a2", "a3"].map((id) => id as any);
        const agentMap: Record<string, Doc<"agents">> = {};
        ids.forEach((id, i) => {
            agentMap[id] = {
                _id: id,
                _creationTime: Date.now(),
                name: `Agent ${i + 1}`,
                role: "agent",
                sessionKey: `key-${id}`,
                status: "active",
                userId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
        });
        const taskWith3: Doc<"tasks"> = { ...mockTask, assigneeIds: ids };

        render(<TaskCard task={taskWith3} onClick={vi.fn()} agentMap={agentMap} />);
        // Only 2 initials should be rendered (A for Agent 1, A for Agent 2 — both "A")
        const initials = screen.getAllByText("A");
        expect(initials.length).toBe(2);
    });
});
