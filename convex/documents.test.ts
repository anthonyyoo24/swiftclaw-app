import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("documents", () => {
    // Initialize by value so TS infers the type; reset in beforeEach for test isolation
    let t = convexTest(schema, modules);

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    // ── Fixtures ─────────────────────────────────────────────────────────

    async function insertAgent() {
        return t.run((ctx) =>
            ctx.db.insert("agents", {
                name: "maya",
                role: "Support",
                status: "idle",
                sessionKey: "test-session-key",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
        );
    }

    async function insertTask() {
        return t.run((ctx) =>
            ctx.db.insert("tasks", {
                title: "Test Task",
                description: "A test description",
                status: "assigned",
                assigneeIds: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
        );
    }

    // ── list ──────────────────────────────────────────────────────────────

    describe("list", () => {
        it("returns an empty array when no documents exist", async () => {
            const docs = await t.query(api.documents.list, {});
            expect(docs).toEqual([]);
        });

        it("returns all inserted documents", async () => {
            const agentId = await insertAgent();

            await t.mutation(api.documents.createByAgent, {
                title: "Doc A",
                content: "Content A",
                type: "deliverable",
                agentName: "maya",
            });
            await t.mutation(api.documents.createByAgent, {
                title: "Doc B",
                content: "Content B",
                type: "research",
                agentName: "maya",
            });

            const docs = await t.query(api.documents.list, {});
            expect(docs).toHaveLength(2);
            const titles = docs.map((d) => d.title);
            expect(titles).toContain("Doc A");
            expect(titles).toContain("Doc B");
            void agentId;
        });

        it("respects the limit arg", async () => {
            await insertAgent();
            for (let i = 0; i < 5; i++) {
                await t.mutation(api.documents.createByAgent, {
                    title: `Doc ${i}`,
                    content: "x",
                    type: "general",
                    agentName: "maya",
                });
            }

            const docs = await t.query(api.documents.list, { limit: 3 });
            expect(docs).toHaveLength(3);
        });
    });

    // ── getById ───────────────────────────────────────────────────────────

    describe("getById", () => {
        it("returns null for a deleted (nonexistent) ID", async () => {
            await insertAgent();
            const id = await t.mutation(api.documents.createByAgent, {
                title: "Temp",
                content: "x",
                type: "general",
                agentName: "maya",
            });
            await t.run((ctx) => ctx.db.delete(id));

            const result = await t.query(api.documents.getById, { id });
            expect(result).toBeNull();
        });

        it("returns the document when it exists", async () => {
            await insertAgent();
            const id = await t.mutation(api.documents.createByAgent, {
                title: "My Doc",
                content: "# Hello",
                type: "protocol",
                agentName: "maya",
            });

            const doc = await t.query(api.documents.getById, { id });
            expect(doc).not.toBeNull();
            expect(doc?.title).toBe("My Doc");
            expect(doc?.type).toBe("protocol");
        });
    });

    // ── listByTask ────────────────────────────────────────────────────────

    describe("listByTask", () => {
        it("returns an empty array when no documents are linked to the task", async () => {
            const taskId = await insertTask();
            const docs = await t.query(api.documents.listByTask, { taskId });
            expect(docs).toEqual([]);
        });

        it("returns only documents linked to the specified task", async () => {
            await insertAgent();
            const taskId = await insertTask();
            const otherTaskId = await insertTask();

            await t.mutation(api.documents.createByAgent, {
                title: "Linked Doc",
                content: "linked",
                type: "deliverable",
                taskId,
                agentName: "maya",
            });
            await t.mutation(api.documents.createByAgent, {
                title: "Other Task Doc",
                content: "other",
                type: "deliverable",
                taskId: otherTaskId,
                agentName: "maya",
            });
            await t.mutation(api.documents.createByAgent, {
                title: "Unlinked Doc",
                content: "no task",
                type: "general",
                agentName: "maya",
            });

            const docs = await t.query(api.documents.listByTask, { taskId });
            expect(docs).toHaveLength(1);
            expect(docs[0].title).toBe("Linked Doc");
        });

        it("returns multiple documents linked to the same task", async () => {
            await insertAgent();
            const taskId = await insertTask();

            await t.mutation(api.documents.createByAgent, {
                title: "Doc 1",
                content: "c1",
                type: "deliverable",
                taskId,
                agentName: "maya",
            });
            await t.mutation(api.documents.createByAgent, {
                title: "Doc 2",
                content: "c2",
                type: "research",
                taskId,
                agentName: "maya",
            });

            const docs = await t.query(api.documents.listByTask, { taskId });
            expect(docs).toHaveLength(2);
        });
    });

    // ── createByAgent ─────────────────────────────────────────────────────

    describe("createByAgent", () => {
        it("creates a document and returns its ID", async () => {
            const agentId = await insertAgent();

            const id = await t.mutation(api.documents.createByAgent, {
                title: "New Deliverable",
                content: "## Summary\nDone.",
                type: "deliverable",
                agentName: "maya",
            });

            expect(id).toBeDefined();
            const doc = await t.query(api.documents.getById, { id });
            expect(doc?.title).toBe("New Deliverable");
            expect(doc?.createdById).toBe(agentId);
        });

        it("sets createdAt and updatedAt on creation", async () => {
            await insertAgent();
            const before = Date.now();

            const id = await t.mutation(api.documents.createByAgent, {
                title: "Timed Doc",
                content: "x",
                type: "general",
                agentName: "maya",
            });

            const doc = await t.query(api.documents.getById, { id });
            expect(doc?.createdAt).toBeGreaterThanOrEqual(before);
            expect(doc?.updatedAt).toBe(doc?.createdAt);
        });

        it("creates a document with an optional taskId", async () => {
            await insertAgent();
            const taskId = await insertTask();

            const id = await t.mutation(api.documents.createByAgent, {
                title: "Task Doc",
                content: "linked",
                type: "deliverable",
                taskId,
                agentName: "maya",
            });

            const doc = await t.query(api.documents.getById, { id });
            expect(doc?.taskId).toBe(taskId);
        });

        it("throws when the agent name does not exist", async () => {
            await expect(
                t.mutation(api.documents.createByAgent, {
                    title: "Ghost Doc",
                    content: "x",
                    type: "general",
                    agentName: "nonexistent-agent",
                })
            ).rejects.toThrow("Agent not found: nonexistent-agent");
        });
    });

    // ── create (auth-gated) ───────────────────────────────────────────────

    describe("create", () => {
        it("creates a document when the user is authenticated", async () => {
            const agentId = await insertAgent();
            const tAuth = t.withIdentity({ name: "test-user" });

            const id = await tAuth.mutation(api.documents.create, {
                title: "Auth Doc",
                content: "secure content",
                type: "research",
                createdById: agentId,
            });

            const doc = await t.query(api.documents.getById, { id });
            expect(doc?.title).toBe("Auth Doc");
            expect(doc?.createdById).toBe(agentId);
        });

        it("throws when the user is not authenticated", async () => {
            const agentId = await insertAgent();

            await expect(
                t.mutation(api.documents.create, {
                    title: "Unauth Doc",
                    content: "x",
                    type: "general",
                    createdById: agentId,
                })
            ).rejects.toThrow("Not authenticated");
        });
    });
});
