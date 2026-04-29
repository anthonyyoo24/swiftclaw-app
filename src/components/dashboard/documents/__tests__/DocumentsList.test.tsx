// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentsList } from "../DocumentsList";
import { Doc, Id } from "@convex/_generated/dataModel";

vi.mock("@iconify/react", () => ({
    Icon: (props: any) => <span data-testid="icon" {...props} />,
}));
vi.mock("next/image", () => ({
    default: (props: any) => <img {...props} />,
}));
vi.mock("@/constants/ai-core", () => ({
    AGENT_ROLES: {},
}));

const agentId = "agent_1" as Id<"agents">;
const userId = "user_1" as Id<"users">;

function makeDoc(overrides: Partial<Doc<"documents">> & { _id: Id<"documents"> }): Doc<"documents"> {
    return {
        _creationTime: Date.now(),
        title: "Default Title",
        content: "content",
        type: "general",
        createdById: agentId,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    };
}

const doc1 = makeDoc({ _id: "doc_1" as Id<"documents">, title: "First Doc", type: "deliverable" });
const doc2 = makeDoc({ _id: "doc_2" as Id<"documents">, title: "Second Doc", type: "research" });

const defaultProps = {
    documents: [doc1, doc2],
    agentMap: {},
    selectedId: null,
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    typeFilter: "all" as const,
    onTypeFilterChange: vi.fn(),
};

describe("DocumentsList", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders all document cards", () => {
        render(<DocumentsList {...defaultProps} />);
        expect(screen.getByText("First Doc")).toBeInTheDocument();
        expect(screen.getByText("Second Doc")).toBeInTheDocument();
    });

    it("shows the empty state when documents array is empty", () => {
        render(<DocumentsList {...defaultProps} documents={[]} />);
        expect(screen.getByText("No documents yet.")).toBeInTheDocument();
        expect(screen.getByText("Agents will publish documents here.")).toBeInTheDocument();
    });

    it("renders all filter tab labels", () => {
        render(<DocumentsList {...defaultProps} />);
        expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Deliverable" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Research" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Protocol" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "General" })).toBeInTheDocument();
    });

    it("highlights the active filter tab", () => {
        render(<DocumentsList {...defaultProps} typeFilter="research" />);
        const researchBtn = screen.getByRole("button", { name: "Research" });
        expect(researchBtn.className).toMatch(/bg-white\/10/);
        const allBtn = screen.getByRole("button", { name: "All" });
        expect(allBtn.className).not.toMatch(/bg-white\/10/);
    });

    it("calls onTypeFilterChange when a filter tab is clicked", async () => {
        const onTypeFilterChange = vi.fn();
        const user = userEvent.setup();
        render(<DocumentsList {...defaultProps} onTypeFilterChange={onTypeFilterChange} />);

        await user.click(screen.getByRole("button", { name: "Deliverable" }));
        expect(onTypeFilterChange).toHaveBeenCalledWith("deliverable");
    });

    it("calls onSelect with the document ID when a card is clicked", async () => {
        const onSelect = vi.fn();
        const user = userEvent.setup();
        render(<DocumentsList {...defaultProps} onSelect={onSelect} />);

        await user.click(screen.getByText("First Doc"));
        expect(onSelect).toHaveBeenCalledWith("doc_1");
    });
});
