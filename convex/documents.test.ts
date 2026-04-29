import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const WORKSPACE_SECRET = "test-workspace-secret";

describe("documents", () => {
    let t = convexTest(schema, modules);

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    // ── Fixtures ──────────────────────────────────────────────────────────

    async function seedUser() {
        return t.run((ctx) => ctx.db.insert("users", {}));
    }

    async function insertWorkspace(userId: string, workspaceSecret = WORKSPACE_SECRET) {
        return t.run(async (ctx) => {
            const existing = await ctx.db
                .query("workspaces")
                .withIndex("by_workspaceSecret", (q) => q.eq("workspaceSecret", workspaceSecret))
                .unique();
            if (existing) return existing._id;
            const now = Date.now();
            return ctx.db.insert("workspaces", {
                userId: userId as never,
                workspaceSecret,
                createdAt: now,
                updatedAt: now,
            });
        });
    }

    async function insertAgent(userId: string) {
        const workspaceId = await insertWorkspace(userId);
        return t.run((ctx) =>
            ctx.db.insert("agents", {
                name: "maya",
                role: "Support",
                status: "idle",
                sessionKey: "test-session-key",
                userId: userId as never,
                workspaceId: workspaceId as never,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
        );
    }

    async function insertTask(userId: string) {
        return t.run((ctx) =>
            ctx.db.insert("tasks", {
                title: "Test Task",
                description: "A test description",
                status: "assigned",
                assigneeIds: [],
                userId: userId as never,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
        );
    }

    // ── list ──────────────────────────────────────────────────────────────

    describe("list", () => {
        it("throws when called without authentication", async () => {
            await expect(t.query(api.documents.list, {})).rejects.toThrow("Not authenticated");
        });

        it("returns an empty array when no documents exist", async () => {
            const userId = await seedUser();
            const docs = await t.withIdentity({ subject: userId }).query(api.documents.list, {});
            expect(docs).toEqual([]);
        });

        it("returns only the authenticated user's documents", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            await t.mutation(api.documents.create, {
                title: "Doc A",
                content: "Content A",
                type: "deliverable",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            const otherUserId = await seedUser();
            // Other user has no agents/docs

            const docs = await t.withIdentity({ subject: userId }).query(api.documents.list, {});
            expect(docs).toHaveLength(1);
            expect(docs[0].title).toBe("Doc A");

            const otherDocs = await t.withIdentity({ subject: otherUserId }).query(api.documents.list, {});
            expect(otherDocs).toHaveLength(0);
        });

        it("respects the limit arg", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            for (let i = 0; i < 5; i++) {
                await t.mutation(api.documents.create, {
                    title: `Doc ${i}`,
                    content: "x",
                    type: "general",
                    agentName: "maya",
                    workspaceSecret: WORKSPACE_SECRET,
                });
            }

            const docs = await t.withIdentity({ subject: userId }).query(api.documents.list, { limit: 3 });
            expect(docs).toHaveLength(3);
        });
    });

    // ── getById ───────────────────────────────────────────────────────────

    describe("getById", () => {
        it("throws when called without authentication", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const id = await t.mutation(api.documents.create, {
                title: "Temp",
                content: "x",
                type: "general",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });
            await expect(t.query(api.documents.getById, { id })).rejects.toThrow("Not authenticated");
        });

        it("returns null for a deleted (nonexistent) ID", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const id = await t.mutation(api.documents.create, {
                title: "Temp",
                content: "x",
                type: "general",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });
            await t.run((ctx) => ctx.db.delete(id));

            const result = await t.withIdentity({ subject: userId }).query(api.documents.getById, { id });
            expect(result).toBeNull();
        });

        it("returns the document when it exists", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const id = await t.mutation(api.documents.create, {
                title: "My Doc",
                content: "# Hello",
                type: "protocol",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            const doc = await t.withIdentity({ subject: userId }).query(api.documents.getById, { id });
            expect(doc).not.toBeNull();
            expect(doc?.title).toBe("My Doc");
            expect(doc?.type).toBe("protocol");
        });
    });

    // ── listByTask ────────────────────────────────────────────────────────

    describe("listByTask", () => {
        it("throws when called without authentication", async () => {
            const userId = await seedUser();
            const taskId = await insertTask(userId);
            await expect(t.query(api.documents.listByTask, { taskId })).rejects.toThrow("Not authenticated");
        });

        it("returns an empty array when no documents are linked to the task", async () => {
            const userId = await seedUser();
            const taskId = await insertTask(userId);
            const docs = await t.withIdentity({ subject: userId }).query(api.documents.listByTask, { taskId });
            expect(docs).toEqual([]);
        });

        it("returns only documents linked to the specified task", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const taskId = await insertTask(userId);
            const otherTaskId = await insertTask(userId);

            await t.mutation(api.documents.create, {
                title: "Linked Doc",
                content: "linked",
                type: "deliverable",
                taskId,
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });
            await t.mutation(api.documents.create, {
                title: "Other Task Doc",
                content: "other",
                type: "deliverable",
                taskId: otherTaskId,
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });
            await t.mutation(api.documents.create, {
                title: "Unlinked Doc",
                content: "no task",
                type: "general",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            const docs = await t.withIdentity({ subject: userId }).query(api.documents.listByTask, { taskId });
            expect(docs).toHaveLength(1);
            expect(docs[0].title).toBe("Linked Doc");
        });

        it("returns multiple documents linked to the same task", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const taskId = await insertTask(userId);

            await t.mutation(api.documents.create, { title: "Doc 1", content: "c1", type: "deliverable", taskId, agentName: "maya", workspaceSecret: WORKSPACE_SECRET });
            await t.mutation(api.documents.create, { title: "Doc 2", content: "c2", type: "research", taskId, agentName: "maya", workspaceSecret: WORKSPACE_SECRET });

            const docs = await t.withIdentity({ subject: userId }).query(api.documents.listByTask, { taskId });
            expect(docs).toHaveLength(2);
        });
    });

    // ── create ────────────────────────────────────────────────────────────

    describe("create", () => {
        it("creates a document and returns its ID", async () => {
            const userId = await seedUser();
            const agentId = await insertAgent(userId);

            const id = await t.mutation(api.documents.create, {
                title: "New Deliverable",
                content: "## Summary\nDone.",
                type: "deliverable",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            expect(id).toBeDefined();
            const doc = await t.withIdentity({ subject: userId }).query(api.documents.getById, { id });
            expect(doc?.title).toBe("New Deliverable");
            expect(doc?.createdById).toBe(agentId);
        });

        it("sets createdAt and updatedAt on creation", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const before = Date.now();

            const id = await t.mutation(api.documents.create, {
                title: "Timed Doc",
                content: "x",
                type: "general",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            const doc = await t.withIdentity({ subject: userId }).query(api.documents.getById, { id });
            expect(doc?.createdAt).toBeGreaterThanOrEqual(before);
            expect(doc?.updatedAt).toBe(doc?.createdAt);
        });

        it("creates a document with an optional taskId", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const taskId = await insertTask(userId);

            const id = await t.mutation(api.documents.create, {
                title: "Task Doc",
                content: "linked",
                type: "deliverable",
                taskId,
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            const doc = await t.withIdentity({ subject: userId }).query(api.documents.getById, { id });
            expect(doc?.taskId).toBe(taskId);
        });

        it("throws when the agent name does not exist", async () => {
            const userId = await seedUser();
            await insertWorkspace(userId);
            await expect(
                t.mutation(api.documents.create, {
                    title: "Ghost Doc",
                    content: "x",
                    type: "general",
                    agentName: "nonexistent-agent",
                    workspaceSecret: WORKSPACE_SECRET,
                })
            ).rejects.toThrow("Agent not found: nonexistent-agent");
        });

        it("inserts a document_created activity after creation", async () => {
            const userId = await seedUser();
            await insertAgent(userId);

            await t.mutation(api.documents.create, {
                title: "Activity Doc",
                content: "x",
                type: "general",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            const activities = await t.run((ctx) => ctx.db.query("activities").collect());
            expect(activities).toHaveLength(1);
            expect(activities[0].type).toBe("document_created");
        });

        it("sets the activity message to the document title", async () => {
            const userId = await seedUser();
            await insertAgent(userId);

            await t.mutation(api.documents.create, {
                title: "My Report",
                content: "x",
                type: "deliverable",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            const activities = await t.run((ctx) => ctx.db.query("activities").collect());
            expect(activities[0].message).toContain("My Report");
        });

        it("uses workspaceSecret to publish under the correct duplicate agent name", async () => {
            const userAId = await seedUser();
            const userBId = await seedUser();
            const userASecret = "user-a-workspace";
            const userBSecret = "user-b-workspace";
            const userAWorkspaceId = await insertWorkspace(userAId, userASecret);
            const userBWorkspaceId = await insertWorkspace(userBId, userBSecret);
            const [, userBAgentId] = await Promise.all([
                t.run((ctx) =>
                    ctx.db.insert("agents", {
                        name: "maya",
                        role: "Support",
                        status: "idle",
                        sessionKey: "a-session",
                        userId: userAId as never,
                        workspaceId: userAWorkspaceId as never,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    })
                ),
                t.run((ctx) =>
                    ctx.db.insert("agents", {
                        name: "maya",
                        role: "Support",
                        status: "idle",
                        sessionKey: "b-session",
                        userId: userBId as never,
                        workspaceId: userBWorkspaceId as never,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    })
                ),
            ]);

            const id = await t.mutation(api.documents.create, {
                title: "User B Report",
                content: "x",
                type: "deliverable",
                agentName: "maya",
                workspaceSecret: userBSecret,
            });

            const doc = await t.withIdentity({ subject: userBId }).query(api.documents.getById, { id });
            expect(doc?.userId).toBe(userBId);
            expect(doc?.createdById).toBe(userBAgentId);
            const userADoc = await t.withIdentity({ subject: userAId }).query(api.documents.getById, { id });
            expect(userADoc).toBeNull();
        });

        it("rejects a taskId that belongs to a different workspace/user", async () => {
            const ownerUserId = await seedUser();
            const attackerUserId = await seedUser();
            const ownerTaskId = await insertTask(ownerUserId);
            const attackerWorkspaceId = await insertWorkspace(attackerUserId, "attacker-secret");
            await t.run((ctx) =>
                ctx.db.insert("agents", {
                    name: "maya",
                    role: "Support",
                    status: "idle",
                    sessionKey: "attacker-session",
                    userId: attackerUserId as never,
                    workspaceId: attackerWorkspaceId as never,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                })
            );

            await expect(
                t.mutation(api.documents.create, {
                    title: "Exploit Doc",
                    content: "x",
                    type: "general",
                    taskId: ownerTaskId,
                    agentName: "maya",
                    workspaceSecret: "attacker-secret",
                })
            ).rejects.toThrow("Task not found");
        });
    });

    // ── remove ────────────────────────────────────────────────────────────

    describe("remove", () => {
        it("throws when called without authentication", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const id = await t.mutation(api.documents.create, {
                title: "To Delete",
                content: "x",
                type: "general",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });
            await expect(t.mutation(api.documents.remove, { id })).rejects.toThrow("Not authenticated");
        });

        it("deletes a document so it no longer appears in list", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const id = await t.mutation(api.documents.create, {
                title: "To Delete",
                content: "x",
                type: "general",
                agentName: "maya",
                workspaceSecret: WORKSPACE_SECRET,
            });

            await t.withIdentity({ subject: userId }).mutation(api.documents.remove, { id });

            const docs = await t.withIdentity({ subject: userId }).query(api.documents.list, {});
            expect(docs).toHaveLength(0);
        });

        it("only removes the targeted document", async () => {
            const userId = await seedUser();
            await insertAgent(userId);
            const idToRemove = await t.mutation(api.documents.create, { title: "Remove Me", content: "x", type: "general", agentName: "maya", workspaceSecret: WORKSPACE_SECRET });
            await t.mutation(api.documents.create, { title: "Keep Me", content: "y", type: "general", agentName: "maya", workspaceSecret: WORKSPACE_SECRET });

            await t.withIdentity({ subject: userId }).mutation(api.documents.remove, { id: idToRemove });

            const docs = await t.withIdentity({ subject: userId }).query(api.documents.list, {});
            expect(docs).toHaveLength(1);
            expect(docs[0].title).toBe("Keep Me");
        });
    });
});
