// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreateTaskModal } from '../CreateTaskModal';

// Mock convex
const mockCreateTask = vi.fn();
vi.mock("convex/react", () => ({
    useMutation: () => mockCreateTask,
    useQuery: () => [],
}));

// Mock sonner
vi.mock("sonner", () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}));

describe('CreateTaskModal', () => {
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
});
