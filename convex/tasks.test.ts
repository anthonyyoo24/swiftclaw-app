/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// Helper: seed an agent directly (no auth required)
async function seedAgent(t: ReturnType<typeof convexTest>, name: string) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("agents", {
      name,
      role: "specialist",
      status: "idle" as const,
      sessionKey: `agent:${name.toLowerCase()}:main`,
      createdAt: now,
      updatedAt: now,
    });
  });
}

// Helper: seed a task directly
async function seedTask(
  t: ReturnType<typeof convexTest>,
  opts: {
    title?: string;
    status: "inbox" | "assigned" | "in_progress" | "review" | "done";
    assigneeIds: string[];
  }
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("tasks", {
      title: opts.title ?? "Test task",
      description: "Test description",
      status: opts.status,
      assigneeIds: opts.assigneeIds as never,
      createdAt: now,
      updatedAt: now,
    });
  });
}

describe("tasks:getAssigned", () => {
  it("returns null when the agent name does not exist", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.tasks.getAssigned, { agentName: "maya" });
    expect(result).toBeNull();
  });

  it("returns null when the agent exists but has no tasks at all", async () => {
    const t = convexTest(schema, modules);
    await seedAgent(t, "maya");
    const result = await t.query(api.tasks.getAssigned, { agentName: "maya" });
    expect(result).toBeNull();
  });

  it("returns null when the agent has tasks but none are assigned", async () => {
    const t = convexTest(schema, modules);
    const agentId = await seedAgent(t, "maya");
    await seedTask(t, { status: "in_progress", assigneeIds: [agentId] });
    await seedTask(t, { status: "done", assigneeIds: [agentId] });

    const result = await t.query(api.tasks.getAssigned, { agentName: "maya" });
    expect(result).toBeNull();
  });

  it("returns the assigned task when one exists for the agent", async () => {
    const t = convexTest(schema, modules);
    const agentId = await seedAgent(t, "maya");
    const taskId = await seedTask(t, { title: "Write blog post", status: "assigned", assigneeIds: [agentId] });

    const result = await t.query(api.tasks.getAssigned, { agentName: "maya" });
    expect(result).not.toBeNull();
    expect(result!._id).toBe(taskId);
    expect(result!.title).toBe("Write blog post");
    expect(result!.status).toBe("assigned");
  });

  it("returns only this agent's task, not another agent's assigned task", async () => {
    const t = convexTest(schema, modules);
    const mayaId = await seedAgent(t, "maya");
    const jackId = await seedAgent(t, "Jack");
    await seedTask(t, { title: "Jack's task", status: "assigned", assigneeIds: [jackId] });
    const mayaTaskId = await seedTask(t, { title: "Maya's task", status: "assigned", assigneeIds: [mayaId] });

    const result = await t.query(api.tasks.getAssigned, { agentName: "maya" });
    expect(result).not.toBeNull();
    expect(result!._id).toBe(mayaTaskId);
    expect(result!.title).toBe("Maya's task");
  });

  it("returns the oldest assigned task first when the agent has multiple", async () => {
    const t = convexTest(schema, modules);
    const agentId = await seedAgent(t, "maya");
    const firstTaskId = await seedTask(t, { title: "First task", status: "assigned", assigneeIds: [agentId] });
    await seedTask(t, { title: "Second task", status: "assigned", assigneeIds: [agentId] });

    const result = await t.query(api.tasks.getAssigned, { agentName: "maya" });
    expect(result!._id).toBe(firstTaskId);
  });
});

describe("tasks:list", () => {
  it("returns an empty array when no tasks exist", async () => {
    const t = convexTest(schema, modules);
    const tasks = await t.query(api.tasks.list, {});
    expect(tasks).toHaveLength(0);
  });

  it("returns all tasks that have been inserted", async () => {
    const t = convexTest(schema, modules);
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "Task A" });
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "Task B" });
    const tasks = await t.query(api.tasks.list, {});
    expect(tasks).toHaveLength(2);
  });

  it("respects the limit argument", async () => {
    const t = convexTest(schema, modules);
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "T1" });
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "T2" });
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "T3" });
    const tasks = await t.query(api.tasks.list, { limit: 2 });
    expect(tasks).toHaveLength(2);
  });
});

describe("tasks:remove", () => {
  it("deletes a task so it no longer appears in list", async () => {
    const t = convexTest(schema, modules);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "To Delete" });
    await t.mutation(api.tasks.remove, { id });
    const tasks = await t.query(api.tasks.list, {});
    expect(tasks).toHaveLength(0);
  });

  it("only removes the targeted task", async () => {
    const t = convexTest(schema, modules);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "Remove Me" });
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "Keep Me" });
    await t.mutation(api.tasks.remove, { id });
    const tasks = await t.query(api.tasks.list, {});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Keep Me");
  });
});

describe("tasks:update", () => {
  it("patches the task status", async () => {
    const t = convexTest(schema, modules);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "Update Me" });
    await t.mutation(api.tasks.update, { id, status: "in_progress" });
    const tasks = await t.query(api.tasks.list, {});
    expect(tasks[0].status).toBe("in_progress");
  });

  it("updates updatedAt when status changes", async () => {
    const t = convexTest(schema, modules);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "Timestamp Check" });
    const before = (await t.query(api.tasks.list, {}))[0].updatedAt;
    await t.mutation(api.tasks.update, { id, status: "review" });
    const after = (await t.query(api.tasks.list, {}))[0].updatedAt;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

describe("tasks:create", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.tasks.create, {
        title: "No Auth Task",
        description: "",
        status: "inbox",
        assigneeIds: [],
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("creates a task and it appears in list when authenticated", async () => {
    const t = convexTest(schema, modules);
    await t.withIdentity({ name: "Test User" }).mutation(api.tasks.create, {
      title: "Auth Task",
      description: "Some work",
      status: "inbox",
      assigneeIds: [],
    });
    const tasks = await t.query(api.tasks.list, {});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Auth Task");
    expect(tasks[0].status).toBe("inbox");
  });
});

describe("tasks:assign", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [] });
    const agentId = await seedAgent(t, "Atlas");
    await expect(
      t.mutation(api.tasks.assign, { id, assigneeIds: [agentId] })
    ).rejects.toThrow("Not authenticated");
  });

  it("patches assigneeIds on the task when authenticated", async () => {
    const t = convexTest(schema, modules);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "Assign Me" });
    const agentId = await seedAgent(t, "Atlas");
    await t.withIdentity({ name: "Test User" }).mutation(api.tasks.assign, {
      id,
      assigneeIds: [agentId],
    });
    const tasks = await t.query(api.tasks.list, {});
    expect(tasks[0].assigneeIds).toContain(agentId);
  });
});
