// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../ConfirmDialog";

// Flatten Radix Dialog to plain divs so tests stay unit-level
vi.mock("@/components/ui/Dialog", () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogClose: ({ children, asChild }: any) => asChild ? children : <button>{children}</button>,
}));

vi.mock("@/components/ui/Button", () => ({
    Button: ({ children, onClick, className }: any) => (
        <button onClick={onClick} className={className}>{children}</button>
    ),
}));

const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Delete document?",
    description: "This action cannot be undone.",
    onConfirm: vi.fn(),
};

describe("ConfirmDialog", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders nothing when open is false", () => {
        render(<ConfirmDialog {...defaultProps} open={false} />);
        expect(screen.queryByText("Delete document?")).not.toBeInTheDocument();
    });

    it("renders the title when open", () => {
        render(<ConfirmDialog {...defaultProps} />);
        expect(screen.getByText("Delete document?")).toBeInTheDocument();
    });

    it("renders the description when open", () => {
        render(<ConfirmDialog {...defaultProps} />);
        expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    });

    it("renders 'Delete' as the default confirm label", () => {
        render(<ConfirmDialog {...defaultProps} />);
        expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });

    it("renders a custom confirmLabel when provided", () => {
        render(<ConfirmDialog {...defaultProps} confirmLabel="Remove" />);
        expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    });

    it("calls onConfirm when the confirm button is clicked", async () => {
        const onConfirm = vi.fn();
        const user = userEvent.setup();
        render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

        await user.click(screen.getByRole("button", { name: "Delete" }));

        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it("calls onOpenChange(false) when the confirm button is clicked", async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

        await user.click(screen.getByRole("button", { name: "Delete" }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not call onConfirm when Cancel is clicked", async () => {
        const onConfirm = vi.fn();
        const user = userEvent.setup();
        render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onConfirm).not.toHaveBeenCalled();
    });
});
