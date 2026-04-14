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
    const result = await t.query(api.tasks.getAssigned, { agentName: "Maya" });
    expect(result).toBeNull();
  });

  it("returns null when the agent exists but has no tasks at all", async () => {
    const t = convexTest(schema, modules);
    await seedAgent(t, "Maya");
    const result = await t.query(api.tasks.getAssigned, { agentName: "Maya" });
    expect(result).toBeNull();
  });

  it("returns null when the agent has tasks but none are assigned", async () => {
    const t = convexTest(schema, modules);
    const agentId = await seedAgent(t, "Maya");
    await seedTask(t, { status: "in_progress", assigneeIds: [agentId] });
    await seedTask(t, { status: "done", assigneeIds: [agentId] });

    const result = await t.query(api.tasks.getAssigned, { agentName: "Maya" });
    expect(result).toBeNull();
  });

  it("returns the assigned task when one exists for the agent", async () => {
    const t = convexTest(schema, modules);
    const agentId = await seedAgent(t, "Maya");
    const taskId = await seedTask(t, { title: "Write blog post", status: "assigned", assigneeIds: [agentId] });

    const result = await t.query(api.tasks.getAssigned, { agentName: "Maya" });
    expect(result).not.toBeNull();
    expect(result!._id).toBe(taskId);
    expect(result!.title).toBe("Write blog post");
    expect(result!.status).toBe("assigned");
  });

  it("returns only this agent's task, not another agent's assigned task", async () => {
    const t = convexTest(schema, modules);
    const mayaId = await seedAgent(t, "Maya");
    const jackId = await seedAgent(t, "Jack");
    await seedTask(t, { title: "Jack's task", status: "assigned", assigneeIds: [jackId] });
    const mayaTaskId = await seedTask(t, { title: "Maya's task", status: "assigned", assigneeIds: [mayaId] });

    const result = await t.query(api.tasks.getAssigned, { agentName: "Maya" });
    expect(result).not.toBeNull();
    expect(result!._id).toBe(mayaTaskId);
    expect(result!.title).toBe("Maya's task");
  });

  it("returns the oldest assigned task first when the agent has multiple", async () => {
    const t = convexTest(schema, modules);
    const agentId = await seedAgent(t, "Maya");
    const firstTaskId = await seedTask(t, { title: "First task", status: "assigned", assigneeIds: [agentId] });
    await seedTask(t, { title: "Second task", status: "assigned", assigneeIds: [agentId] });

    const result = await t.query(api.tasks.getAssigned, { agentName: "Maya" });
    expect(result!._id).toBe(firstTaskId);
  });
});
