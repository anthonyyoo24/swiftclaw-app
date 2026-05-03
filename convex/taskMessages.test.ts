/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedUser(t: ReturnType<typeof convexTest>) {
  return t.run((ctx) => ctx.db.insert("users", {}));
}

async function seedAgent(
  t: ReturnType<typeof convexTest>,
  name: string,
  userId: string
) {
  return t.run((ctx) =>
    ctx.db.insert("agents", {
      name,
      role: "agent",
      status: "idle" as const,
      sessionKey: `session-${name}`,
      userId: userId as never,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  );
}

async function seedTask(
  t: ReturnType<typeof convexTest>,
  userId: string,
  title = "Test Task"
) {
  return t.run((ctx) =>
    ctx.db.insert("tasks", {
      title,
      description: "desc",
      status: "assigned",
      assigneeIds: [],
      userId: userId as never,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  );
}

async function seedDocument(
  t: ReturnType<typeof convexTest>,
  userId: string,
  agentId: string
) {
  return t.run((ctx) =>
    ctx.db.insert("documents", {
      title: "Test Doc",
      content: "content",
      type: "general",
      createdById: agentId as never,
      userId: userId as never,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  );
}

// ── taskMessages:listByTask ───────────────────────────────────────────────────

describe("taskMessages:listByTask", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const taskId = await seedTask(t, userId);
    await expect(
      t.query(api.taskMessages.listByTask, { taskId })
    ).rejects.toThrow("Not authenticated");
  });

  it("returns empty array for a cross-user task", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const taskB = await seedTask(t, userBId);
    const agentB = await seedAgent(t, "maya", userBId);
    await t.run((ctx) =>
      ctx.db.insert("taskMessages", {
        taskId: taskB as never,
        fromAgentId: agentB as never,
        content: "hello",
        userId: userBId as never,
        createdAt: Date.now(),
      })
    );

    const messages = await t.withIdentity({ subject: userAId }).query(api.taskMessages.listByTask, {
      taskId: taskB,
    });
    expect(messages).toHaveLength(0);
  });

  it("returns messages for the authenticated user's task", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const taskId = await seedTask(t, userId);
    const agentId = await seedAgent(t, "maya", userId);
    await t.run((ctx) =>
      ctx.db.insert("taskMessages", {
        taskId: taskId as never,
        fromAgentId: agentId as never,
        content: "hello",
        userId: userId as never,
        createdAt: Date.now(),
      })
    );

    const messages = await t.withIdentity({ subject: userId }).query(api.taskMessages.listByTask, {
      taskId,
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe("hello");
  });
});

// ── taskMessages:send ─────────────────────────────────────────────────────────

describe("taskMessages:send", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const taskId = await seedTask(t, userId);
    const agentId = await seedAgent(t, "maya", userId);
    await expect(
      t.mutation(api.taskMessages.send, {
        taskId,
        fromAgentId: agentId,
        content: "hello",
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("sends a message for the authenticated user's task and agent", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const taskId = await seedTask(t, userId);
    const agentId = await seedAgent(t, "maya", userId);

    const id = await t.withIdentity({ subject: userId }).mutation(api.taskMessages.send, {
      taskId,
      fromAgentId: agentId,
      content: "hello world",
    });

    expect(id).toBeDefined();
    const msg = await t.run((ctx) => ctx.db.get(id));
    expect(msg?.content).toBe("hello world");
    expect(msg?.userId).toBe(userId);
  });

  it("rejects cross-user taskId", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const taskB = await seedTask(t, userBId);
    const agentA = await seedAgent(t, "maya", userAId);

    await expect(
      t.withIdentity({ subject: userAId }).mutation(api.taskMessages.send, {
        taskId: taskB,
        fromAgentId: agentA,
        content: "exploit",
      })
    ).rejects.toThrow("Task not found");
  });

  it("rejects cross-user fromAgentId", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const taskA = await seedTask(t, userAId);
    const agentB = await seedAgent(t, "maya", userBId);

    await expect(
      t.withIdentity({ subject: userAId }).mutation(api.taskMessages.send, {
        taskId: taskA,
        fromAgentId: agentB,
        content: "exploit",
      })
    ).rejects.toThrow("Agent not found");
  });

  it("rejects cross-user document attachments", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const taskA = await seedTask(t, userAId);
    const agentA = await seedAgent(t, "maya", userAId);
    const agentB = await seedAgent(t, "maya", userBId);
    const docB = await seedDocument(t, userBId, agentB);

    await expect(
      t.withIdentity({ subject: userAId }).mutation(api.taskMessages.send, {
        taskId: taskA,
        fromAgentId: agentA,
        content: "with attachment",
        attachments: [docB],
      })
    ).rejects.toThrow("Document not found");
  });

  it("accepts valid attachments from the same user", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const taskId = await seedTask(t, userId);
    const agentId = await seedAgent(t, "maya", userId);
    const docId = await seedDocument(t, userId, agentId);

    const id = await t.withIdentity({ subject: userId }).mutation(api.taskMessages.send, {
      taskId,
      fromAgentId: agentId,
      content: "with attachment",
      attachments: [docId],
    });

    const msg = await t.run((ctx) => ctx.db.get(id));
    expect(msg?.attachments).toContain(docId);
  });
});
