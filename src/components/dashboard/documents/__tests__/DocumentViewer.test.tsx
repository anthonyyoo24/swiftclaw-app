// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentViewer } from "../DocumentViewer";
import { Doc, Id } from "@convex/_generated/dataModel";

vi.mock("react-markdown", () => ({
    default: ({ children }: { children: string }) => (
        <div data-testid="markdown-content">{children}</div>
    ),
}));
vi.mock("remark-gfm", () => ({ default: vi.fn() }));

vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" {...props} />,
}));
vi.mock("next/image", () => ({
    default: (props: any) => <img {...props} />,
}));
vi.mock("@/constants/ai-core", () => ({
    AGENT_ROLES: {
        maya: { displayName: "Maya", role: "Support", avatar: "/avatars/maya.png" },
    },
}));
vi.mock("@/components/ui/ConfirmDialog", () => ({
    ConfirmDialog: (props: any) => mockConfirmDialog(props),
}));

const mockConfirmDialog: (props: unknown) => null = vi.fn(() => null);

const agentId = "agent_1" as Id<"agents">;
const taskId = "task_1" as Id<"tasks">;
const userId = "user_1" as Id<"users">;

const baseAgent: Doc<"agents"> = {
    _id: agentId,
    _creationTime: Date.now(),
    name: "maya",
    role: "Support",
    status: "idle",
    sessionKey: "key-1",
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

const baseDoc: Doc<"documents"> = {
    _id: "doc_1" as Id<"documents">,
    _creationTime: Date.now(),
    title: "Competitive Analysis Report",
    content: "## Overview\nThis is the content.",
    type: "research",
    createdById: agentId,
    userId,
    createdAt: new Date("2025-04-15T10:00:00Z").getTime(),
    updatedAt: new Date("2025-04-15T10:00:00Z").getTime(),
};

describe("DocumentViewer", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders the document title", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={vi.fn()} />);
        expect(screen.getByText("Competitive Analysis Report")).toBeInTheDocument();
    });

    it("renders the correct type badge label", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={vi.fn()} />);
        expect(screen.getByText("Research")).toBeInTheDocument();
    });

    it("renders the agent name when the agent is in agentMap", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{ [agentId]: baseAgent }} onDelete={vi.fn()} />);
        expect(screen.getByText("Maya")).toBeInTheDocument();
    });

    it("falls back to 'Unknown agent' when agent is not in agentMap", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={vi.fn()} />);
        expect(screen.getByText("Unknown agent")).toBeInTheDocument();
    });

    it("shows an agent avatar image when the agent has an AGENT_ROLES entry", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{ [agentId]: baseAgent }} onDelete={vi.fn()} />);
        const img = screen.getByRole("img", { name: /maya/i });
        expect(img).toHaveAttribute("src", "/avatars/maya.png");
    });

    it("renders the markdown content", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={vi.fn()} />);
        const el = screen.getByTestId("markdown-content");
        expect(el).toHaveTextContent("## Overview");
        expect(el).toHaveTextContent("This is the content.");
    });

    it("shows the 'Linked task' chip when taskId is present", () => {
        const docWithTask: Doc<"documents"> = { ...baseDoc, taskId };
        render(<DocumentViewer document={docWithTask} agentMap={{}} onDelete={vi.fn()} />);
        expect(screen.getByText("Linked task")).toBeInTheDocument();
    });

    it("hides the 'Linked task' chip when taskId is absent", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={vi.fn()} />);
        expect(screen.queryByText("Linked task")).not.toBeInTheDocument();
    });

    // ── delete confirmation ───────────────────────────────────────────────

    it("renders the delete button", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={vi.fn()} />);
        expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("opens the confirm dialog when the delete button is clicked", async () => {
        const user = userEvent.setup();
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={vi.fn()} />);

        await user.click(screen.getByRole("button", { name: /delete/i }));

        expect(mockConfirmDialog).toHaveBeenLastCalledWith(
            expect.objectContaining({ open: true })
        );
    });

    it("does not call onDelete immediately when the delete button is clicked", async () => {
        const onDelete = vi.fn();
        const user = userEvent.setup();
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={onDelete} />);

        await user.click(screen.getByRole("button", { name: /delete/i }));

        expect(onDelete).not.toHaveBeenCalled();
    });

    it("passes the document title to the confirm dialog description", async () => {
        const user = userEvent.setup();
        render(<DocumentViewer document={baseDoc} agentMap={{}} onDelete={vi.fn()} />);

        await user.click(screen.getByRole("button", { name: /delete/i }));

        expect(mockConfirmDialog).toHaveBeenLastCalledWith(
            expect.objectContaining({ description: expect.stringContaining("Competitive Analysis Report") })
        );
    });
});
