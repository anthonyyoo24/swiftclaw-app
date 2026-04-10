// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTaskModal } from '../CreateTaskModal';

// Mock convex
const mockCreateTask = vi.fn();
vi.mock("convex/react", () => ({
    useMutation: () => mockCreateTask,
}));

// Mock sonner
vi.mock("sonner", () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}));

describe('CreateTaskModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
    };

    it('renders input fields when open', () => {
        render(<CreateTaskModal {...defaultProps} />);
        expect(screen.getByRole("textbox", { name: /Title/i })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: /Description/i })).toBeInTheDocument();
    });

    it('submit button is disabled initially', () => {
        render(<CreateTaskModal {...defaultProps} />);
        const submitBtn = screen.getByRole("button", { name: /Create Task/i });
        expect(submitBtn).toBeDisabled();
    });

    it('enables submit button when title is filled', async () => {
        const user = userEvent.setup();
        render(<CreateTaskModal {...defaultProps} />);
        const titleInput = screen.getByRole("textbox", { name: /Title/i });
        await user.type(titleInput, "New Task");
        
        const submitBtn = screen.getByRole("button", { name: /Create Task/i });
        expect(submitBtn).not.toBeDisabled();
    });

    it('calls createTask mutation and closes modal on successful submission', async () => {
        mockCreateTask.mockResolvedValueOnce(undefined);
        const onClose = vi.fn();
        const user = userEvent.setup();
        
        render(<CreateTaskModal isOpen={true} onClose={onClose} />);
        
        const titleInput = screen.getByRole("textbox", { name: /Title/i });
        await user.type(titleInput, "Write tests");
        
        const descInput = screen.getByRole("textbox", { name: /Description/i });
        await user.type(descInput, "For the modal");
        
        const submitBtn = screen.getByRole("button", { name: /Create Task/i });
        await user.click(submitBtn);

        expect(mockCreateTask).toHaveBeenCalledWith({
            title: "Write tests",
            description: "For the modal",
            status: "inbox",
            assigneeIds: [],
        });
        expect(onClose).toHaveBeenCalled();
    });

    it('shows toast error on failed submission', async () => {
        const { toast } = await import('sonner');
        mockCreateTask.mockRejectedValueOnce(new Error("Network Error"));
        const onClose = vi.fn();
        const user = userEvent.setup();
        
        render(<CreateTaskModal isOpen={true} onClose={onClose} />);
        
        const titleInput = screen.getByRole("textbox", { name: /Title/i });
        await user.type(titleInput, "Write tests");
        
        const submitBtn = screen.getByRole("button", { name: /Create Task/i });
        await user.click(submitBtn);

        expect(mockCreateTask).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Network Error");
        expect(onClose).not.toHaveBeenCalled();
    });
});
