/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(t: ReturnType<typeof convexTest>) {
  return t.run((ctx) => ctx.db.insert("users", {}));
}

function makeAgent(userId: string, overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    name: "Atlas",
    role: "agent",
    sessionKey: "session-1",
    status: "idle" as const,
    userId: userId as never,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("reset:clearAll", () => {
  it("removes all agents", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    await t.run((ctx) => ctx.db.insert("agents", makeAgent(userId)));

    await t.mutation(api.reset.clearAll, {});

    const agents = await t.run((ctx) => ctx.db.query("agents").collect());
    expect(agents).toHaveLength(0);
  });

  it("removes all tasks", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const userId = await seedUser(t);

    const agentId = await t.run((ctx) => ctx.db.insert("agents", makeAgent(userId)));
    await t.run((ctx) =>
      ctx.db.insert("tasks", {
        title: "Test Task",
        description: "desc",
        status: "inbox" as const,
        assigneeIds: [agentId],
        userId: userId as never,
        createdAt: now,
        updatedAt: now,
      })
    );

    await t.mutation(api.reset.clearAll, {});

    const agents = await t.run((ctx) => ctx.db.query("agents").collect());
    expect(agents).toHaveLength(0);
    const tasks = await t.run((ctx) => ctx.db.query("tasks").collect());
    expect(tasks).toHaveLength(0);
  });

  it("removes all 6 tables when populated", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const userId = await seedUser(t);

    const agentId = await t.run((ctx) => ctx.db.insert("agents", makeAgent(userId)));
    const taskId = await t.run((ctx) =>
      ctx.db.insert("tasks", {
        title: "T",
        description: "d",
        status: "inbox" as const,
        assigneeIds: [agentId],
        userId: userId as never,
        createdAt: now,
        updatedAt: now,
      })
    );
    const docId = await t.run((ctx) =>
      ctx.db.insert("documents", {
        title: "Doc",
        content: "content",
        type: "general" as const,
        createdById: agentId,
        userId: userId as never,
        createdAt: now,
        updatedAt: now,
      })
    );
    await t.run((ctx) =>
      ctx.db.insert("taskMessages", {
        taskId,
        fromAgentId: agentId,
        content: "hi",
        userId: userId as never,
        createdAt: now,
      })
    );
    await t.run((ctx) =>
      ctx.db.insert("activities", {
        type: "task_created" as const,
        agentId,
        message: "created task",
        relatedTaskId: taskId,
        userId: userId as never,
        createdAt: now,
      })
    );
    await t.run((ctx) =>
      ctx.db.insert("notifications", {
        forAgentId: agentId,
        fromAgentId: agentId,
        type: "assignment" as const,
        content: "you were assigned",
        taskId,
        userId: userId as never,
        delivered: false,
        createdAt: now,
      })
    );

    await t.mutation(api.reset.clearAll, {});

    const [agents, tasks, docs, messages, activities, notifications] = await Promise.all([
      t.run((ctx) => ctx.db.query("agents").collect()),
      t.run((ctx) => ctx.db.query("tasks").collect()),
      t.run((ctx) => ctx.db.query("documents").collect()),
      t.run((ctx) => ctx.db.query("taskMessages").collect()),
      t.run((ctx) => ctx.db.query("activities").collect()),
      t.run((ctx) => ctx.db.query("notifications").collect()),
    ]);

    expect(agents).toHaveLength(0);
    expect(tasks).toHaveLength(0);
    expect(docs).toHaveLength(0);
    expect(messages).toHaveLength(0);
    expect(activities).toHaveLength(0);
    expect(notifications).toHaveLength(0);

    void docId;
  });

  it("succeeds when all tables are already empty", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.reset.clearAll, {})).resolves.toBeNull();
  });
});
