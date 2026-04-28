// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentCard } from "../DocumentCard";
import { Doc, Id } from "@convex/_generated/dataModel";

vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" title={props.title || props.icon} {...props} />,
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

const mockConfirmDialog = vi.fn(() => null);

const agentId = "agent_1" as Id<"agents">;

const baseAgent: Doc<"agents"> = {
    _id: agentId,
    _creationTime: Date.now(),
    name: "maya",
    role: "Support",
    status: "idle",
    sessionKey: "key-1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

const baseDoc: Doc<"documents"> = {
    _id: "doc_1" as Id<"documents">,
    _creationTime: Date.now(),
    title: "Q1 Sales Analysis",
    content: "# Report",
    type: "deliverable",
    createdById: agentId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

describe("DocumentCard", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders the document title", () => {
        render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={vi.fn()} onDelete={vi.fn()} />
        );
        expect(screen.getByText("Q1 Sales Analysis")).toBeInTheDocument();
    });

    it.each([
        ["deliverable", "Deliverable"],
        ["research", "Research"],
        ["protocol", "Protocol"],
        ["general", "General"],
    ] as const)("renders the correct badge label for type '%s'", (type, label) => {
        render(
            <DocumentCard
                document={{ ...baseDoc, type }}
                agentMap={{}}
                isSelected={false}
                onClick={vi.fn()}
                onDelete={vi.fn()}
            />
        );
        expect(screen.getByText(label)).toBeInTheDocument();
    });

    it("shows a bot icon when the agent is not in agentMap", () => {
        render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={vi.fn()} onDelete={vi.fn()} />
        );
        expect(screen.getByTitle("lucide:bot")).toBeInTheDocument();
    });

    it("shows an agent avatar image when the agent has an AGENT_ROLES entry", () => {
        const agentMap = { [agentId]: baseAgent };
        render(
            <DocumentCard
                document={baseDoc}
                agentMap={agentMap}
                isSelected={false}
                onClick={vi.fn()}
                onDelete={vi.fn()}
            />
        );
        const img = screen.getByRole("img", { name: /maya/i });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "/avatars/maya.png");
    });

    it("applies the selected border class when isSelected is true", () => {
        const { container } = render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={true} onClick={vi.fn()} onDelete={vi.fn()} />
        );
        const card = container.querySelector('[role="button"]');
        expect(card?.className).toMatch(/border-blue-500/);
    });

    it("does not apply the selected border class when isSelected is false", () => {
        const { container } = render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={vi.fn()} onDelete={vi.fn()} />
        );
        const card = container.querySelector('[role="button"]');
        expect(card?.className).not.toMatch(/border-blue-500/);
    });

    it("calls onClick when the card is clicked", async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={onClick} onDelete={vi.fn()} />
        );
        await user.click(screen.getByText("Q1 Sales Analysis"));
        expect(onClick).toHaveBeenCalledOnce();
    });

    // ── delete confirmation ───────────────────────────────────────────────

    it("renders the delete button", () => {
        render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={vi.fn()} onDelete={vi.fn()} />
        );
        expect(screen.getByTitle("Delete document")).toBeInTheDocument();
    });

    it("opens the confirm dialog when the delete button is clicked", async () => {
        const user = userEvent.setup();
        render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        await user.click(screen.getByTitle("Delete document"));

        expect(mockConfirmDialog).toHaveBeenLastCalledWith(
            expect.objectContaining({ open: true })
        );
    });

    it("does not call onClick when the delete button is clicked", async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={onClick} onDelete={vi.fn()} />
        );

        await user.click(screen.getByTitle("Delete document"));

        expect(onClick).not.toHaveBeenCalled();
    });

    it("does not call onDelete immediately when the delete button is clicked", async () => {
        const onDelete = vi.fn();
        const user = userEvent.setup();
        render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={vi.fn()} onDelete={onDelete} />
        );

        await user.click(screen.getByTitle("Delete document"));

        expect(onDelete).not.toHaveBeenCalled();
    });

    it("passes the document title to the confirm dialog", async () => {
        const user = userEvent.setup();
        render(
            <DocumentCard document={baseDoc} agentMap={{}} isSelected={false} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        await user.click(screen.getByTitle("Delete document"));

        expect(mockConfirmDialog).toHaveBeenLastCalledWith(
            expect.objectContaining({ description: expect.stringContaining("Q1 Sales Analysis") })
        );
    });
});
