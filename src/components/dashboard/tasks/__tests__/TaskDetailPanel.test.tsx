// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDetailPanel } from '../TaskDetailPanel';

let mockTaskQueryResponse: any;
let mockMessagesQueryResponse: any[] | undefined;
const mockRemoveTask = vi.fn();

vi.mock("convex/react", () => ({
    useQuery: (queryName: string) => {
        if (queryName === "api.tasks.getById") return mockTaskQueryResponse;
        if (queryName === "api.taskMessages.listByTask") return mockMessagesQueryResponse;
        return undefined;
    },
    useMutation: () => mockRemoveTask,
}));

vi.mock("@convex/_generated/api", () => ({
    api: {
        tasks: {
            getById: "api.tasks.getById",
            remove: "api.tasks.remove",
        },
        taskMessages: {
            listByTask: "api.taskMessages.listByTask",
        }
    }
}));

vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" {...props} />
}));

describe('TaskDetailPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTaskQueryResponse = undefined;
        mockMessagesQueryResponse = [];
    });

    const defaultProps = {
        taskId: "test_task_id" as any,
        onClose: vi.fn(),
    };

    it('renders a loading skeleton when task is undefined', () => {
        mockTaskQueryResponse = undefined;
        const { container } = render(<TaskDetailPanel {...defaultProps} />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders null if task is null', () => {
        mockTaskQueryResponse = null;
        const { container } = render(<TaskDetailPanel {...defaultProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders task details when loaded', () => {
        mockTaskQueryResponse = {
            _id: "test_task_id",
            title: "Loaded Task",
            description: "Some valid description",
            status: "inbox",
            createdAt: Date.now(),
        };
        render(<TaskDetailPanel {...defaultProps} />);
        
        expect(screen.getByText("Loaded Task")).toBeInTheDocument();
        expect(screen.getByText("Some valid description")).toBeInTheDocument();
    });

    it('calls remove mutation and closes when cancel button is clicked', async () => {
        mockTaskQueryResponse = {
            _id: "test_task_id",
            title: "Loaded Task",
            status: "inbox",
            createdAt: Date.now(),
        };
        const onClose = vi.fn();
        const user = userEvent.setup();
        
        render(<TaskDetailPanel taskId={"test_task_id" as any} onClose={onClose} />);
        
        // Wait, screen might not find it directly if it's named 'Cancel Task'.
        const cancelBtn = screen.getByRole("button", { name: /Cancel Task/i });
        await user.click(cancelBtn);

        expect(mockRemoveTask).toHaveBeenCalledWith({ id: "test_task_id" });
        expect(onClose).toHaveBeenCalled();
    });
});
