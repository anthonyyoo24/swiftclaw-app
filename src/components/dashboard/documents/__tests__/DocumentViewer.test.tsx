// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

const agentId = "agent_1" as Id<"agents">;
const taskId = "task_1" as Id<"tasks">;

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
    title: "Competitive Analysis Report",
    content: "## Overview\nThis is the content.",
    type: "research",
    createdById: agentId,
    createdAt: new Date("2025-04-15T10:00:00Z").getTime(),
    updatedAt: new Date("2025-04-15T10:00:00Z").getTime(),
};

describe("DocumentViewer", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders the document title", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} />);
        expect(screen.getByText("Competitive Analysis Report")).toBeInTheDocument();
    });

    it("renders the correct type badge label", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} />);
        expect(screen.getByText("Research")).toBeInTheDocument();
    });

    it("renders the agent name when the agent is in agentMap", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{ [agentId]: baseAgent }} />);
        expect(screen.getByText("Maya")).toBeInTheDocument();
    });

    it("falls back to 'Unknown agent' when agent is not in agentMap", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} />);
        expect(screen.getByText("Unknown agent")).toBeInTheDocument();
    });

    it("shows an agent avatar image when the agent has an AGENT_ROLES entry", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{ [agentId]: baseAgent }} />);
        const img = screen.getByRole("img", { name: /maya/i });
        expect(img).toHaveAttribute("src", "/avatars/maya.png");
    });

    it("renders the markdown content", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} />);
        const el = screen.getByTestId("markdown-content");
        expect(el).toHaveTextContent("## Overview");
        expect(el).toHaveTextContent("This is the content.");
    });

    it("shows the 'Linked task' chip when taskId is present", () => {
        const docWithTask: Doc<"documents"> = { ...baseDoc, taskId };
        render(<DocumentViewer document={docWithTask} agentMap={{}} />);
        expect(screen.getByText("Linked task")).toBeInTheDocument();
    });

    it("hides the 'Linked task' chip when taskId is absent", () => {
        render(<DocumentViewer document={baseDoc} agentMap={{}} />);
        expect(screen.queryByText("Linked task")).not.toBeInTheDocument();
    });
});
