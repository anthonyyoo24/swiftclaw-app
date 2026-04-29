/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const WORKSPACE_SECRET = "test-workspace-secret";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedUser(t: ReturnType<typeof convexTest>) {
  return t.run((ctx) => ctx.db.insert("users", {}));
}

async function seedWorkspace(
  t: ReturnType<typeof convexTest>,
  userId: string,
  workspaceSecret = WORKSPACE_SECRET
) {
  return t.run(async (ctx) => {
    const existing = (await ctx.db.query("workspaces").collect()).find(
      (workspace) => workspace.workspaceSecret === workspaceSecret
    );
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

async function seedAgent(
  t: ReturnType<typeof convexTest>,
  name: string,
  userId: string,
  workspaceSecret = WORKSPACE_SECRET
) {
  const workspaceId = await seedWorkspace(t, userId, workspaceSecret);
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("agents", {
      name,
      role: "specialist",
      status: "idle" as const,
      sessionKey: `agent:${name.toLowerCase()}:main`,
      userId: userId as never,
      workspaceId: workspaceId as never,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedTask(
  t: ReturnType<typeof convexTest>,
  opts: {
    title?: string;
    status: "inbox" | "assigned" | "in_progress" | "review" | "done";
    assigneeIds: string[];
    userId: string;
  }
) {
  return t.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert("tasks", {
      title: opts.title ?? "Test task",
      description: "Test description",
      status: opts.status,
      assigneeIds: opts.assigneeIds as never,
      userId: opts.userId as never,
      createdAt: now,
      updatedAt: now,
    });
  });
}

// ── tasks:getAssigned ─────────────────────────────────────────────────────────

describe("tasks:getAssigned", () => {
  it("returns null when the agent name does not exist", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedWorkspace(t, userId);
    await expect(
      t.query(api.tasks.getAssigned, { agentName: "maya", workspaceSecret: WORKSPACE_SECRET })
    ).rejects.toThrow("Agent not found: maya");
  });

  it("returns null when the agent exists but has no tasks at all", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedAgent(t, "maya", userId);
    const result = await t.query(api.tasks.getAssigned, { agentName: "maya", workspaceSecret: WORKSPACE_SECRET });
    expect(result).toBeNull();
  });

  it("returns null when the agent has tasks but none are assigned", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    await seedTask(t, { status: "in_progress", assigneeIds: [agentId], userId });
    await seedTask(t, { status: "done", assigneeIds: [agentId], userId });

    const result = await t.query(api.tasks.getAssigned, { agentName: "maya", workspaceSecret: WORKSPACE_SECRET });
    expect(result).toBeNull();
  });

  it("returns the assigned task when one exists for the agent", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    const taskId = await seedTask(t, {
      title: "Write blog post",
      status: "assigned",
      assigneeIds: [agentId],
      userId,
    });

    const result = await t.query(api.tasks.getAssigned, { agentName: "maya", workspaceSecret: WORKSPACE_SECRET });
    expect(result).not.toBeNull();
    expect(result!._id).toBe(taskId);
    expect(result!.title).toBe("Write blog post");
    expect(result!.status).toBe("assigned");
  });

  it("returns only this agent's task, not another agent's assigned task", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const mayaId = await seedAgent(t, "maya", userId);
    const jackId = await seedAgent(t, "Jack", userId);
    await seedTask(t, { title: "Jack's task", status: "assigned", assigneeIds: [jackId], userId });
    const mayaTaskId = await seedTask(t, {
      title: "Maya's task",
      status: "assigned",
      assigneeIds: [mayaId],
      userId,
    });

    const result = await t.query(api.tasks.getAssigned, { agentName: "maya", workspaceSecret: WORKSPACE_SECRET });
    expect(result).not.toBeNull();
    expect(result!._id).toBe(mayaTaskId);
    expect(result!.title).toBe("Maya's task");
  });

  it("returns the oldest assigned task first when the agent has multiple", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    const firstTaskId = await seedTask(t, {
      title: "First task",
      status: "assigned",
      assigneeIds: [agentId],
      userId,
    });
    await seedTask(t, { title: "Second task", status: "assigned", assigneeIds: [agentId], userId });

    const result = await t.query(api.tasks.getAssigned, { agentName: "maya", workspaceSecret: WORKSPACE_SECRET });
    expect(result!._id).toBe(firstTaskId);
  });

  it("uses workspaceSecret to disambiguate duplicate agent names across users", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const userASecret = "user-a-workspace";
    const userBSecret = "user-b-workspace";
    const userAAgentId = await seedAgent(t, "maya", userAId, userASecret);
    const userBAgentId = await seedAgent(t, "maya", userBId, userBSecret);
    const userATaskId = await seedTask(t, {
      title: "User A task",
      status: "assigned",
      assigneeIds: [userAAgentId],
      userId: userAId,
    });
    const userBTaskId = await seedTask(t, {
      title: "User B task",
      status: "assigned",
      assigneeIds: [userBAgentId],
      userId: userBId,
    });

    const userAResult = await t.query(api.tasks.getAssigned, {
      agentName: "maya",
      workspaceSecret: userASecret,
    });
    const userBResult = await t.query(api.tasks.getAssigned, {
      agentName: "maya",
      workspaceSecret: userBSecret,
    });

    expect(userAResult?._id).toBe(userATaskId);
    expect(userBResult?._id).toBe(userBTaskId);
  });
});

// ── tasks:list ────────────────────────────────────────────────────────────────

describe("tasks:list", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.tasks.list, {})).rejects.toThrow("Not authenticated");
  });

  it("returns an empty array when the user has no tasks", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const tasks = await t.withIdentity({ subject: userId }).query(api.tasks.list, {});
    expect(tasks).toHaveLength(0);
  });

  it("returns only the authenticated user's tasks", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "User A Task", userId: userAId });
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "User B Task", userId: userBId });

    const tasks = await t.withIdentity({ subject: userAId }).query(api.tasks.list, {});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("User A Task");
  });

  it("respects the limit argument", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "T1", userId });
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "T2", userId });
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "T3", userId });
    const tasks = await t.withIdentity({ subject: userId }).query(api.tasks.list, { limit: 2 });
    expect(tasks).toHaveLength(2);
  });
});

// ── tasks:remove ─────────────────────────────────────────────────────────────

describe("tasks:remove", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], userId });
    await expect(t.mutation(api.tasks.remove, { id })).rejects.toThrow("Not authenticated");
  });

  it("throws when authenticated as a different user", async () => {
    const t = convexTest(schema, modules);
    const ownerUserId = await seedUser(t);
    const otherUserId = await seedUser(t);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], userId: ownerUserId });

    await expect(
      t.withIdentity({ subject: otherUserId }).mutation(api.tasks.remove, { id })
    ).rejects.toThrow("Task not found");
  });

  it("deletes a task so it no longer appears in list", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "To Delete", userId });
    const authed = t.withIdentity({ subject: userId });
    await authed.mutation(api.tasks.remove, { id });
    const tasks = await authed.query(api.tasks.list, {});
    expect(tasks).toHaveLength(0);
  });

  it("only removes the targeted task", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "Remove Me", userId });
    await seedTask(t, { status: "inbox", assigneeIds: [], title: "Keep Me", userId });
    const authed = t.withIdentity({ subject: userId });
    await authed.mutation(api.tasks.remove, { id });
    const tasks = await authed.query(api.tasks.list, {});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Keep Me");
  });
});

// ── tasks:update ──────────────────────────────────────────────────────────────

describe("tasks:update", () => {
  it("patches the task status", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedWorkspace(t, userId);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "Update Me", userId });
    await t.mutation(api.tasks.update, { id, status: "in_progress", workspaceSecret: WORKSPACE_SECRET });
    const task = await t.run((ctx) => ctx.db.get(id));
    expect(task!.status).toBe("in_progress");
  });

  it("updates updatedAt when status changes", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedWorkspace(t, userId);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "Timestamp Check", userId });
    const before = (await t.run((ctx) => ctx.db.get(id)))!.updatedAt;
    await t.mutation(api.tasks.update, { id, status: "review", workspaceSecret: WORKSPACE_SECRET });
    const after = (await t.run((ctx) => ctx.db.get(id)))!.updatedAt;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("sets agent currentTaskId when status becomes in_progress", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    const id = await seedTask(t, {
      status: "assigned",
      assigneeIds: [agentId],
      title: "In Progress Task",
      userId,
    });

    await t.mutation(api.tasks.update, { id, status: "in_progress", agentName: "maya", workspaceSecret: WORKSPACE_SECRET });

    const agent = await t.run((ctx) => ctx.db.get(agentId));
    expect(agent?.currentTaskId).toBe(id);
  });

  it("clears agent currentTaskId when status becomes done", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    const id = await seedTask(t, { status: "in_progress", assigneeIds: [agentId], title: "Done Task", userId });
    await t.run((ctx) => ctx.db.patch(agentId, { currentTaskId: id as never }));

    await t.mutation(api.tasks.update, { id, status: "done", agentName: "maya", workspaceSecret: WORKSPACE_SECRET });

    const agent = await t.run((ctx) => ctx.db.get(agentId));
    expect(agent?.currentTaskId).toBeUndefined();
  });

  it("inserts a task_status_changed activity when agentName is provided", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    const id = await seedTask(t, { status: "assigned", assigneeIds: [agentId], title: "Activity Task", userId });

    await t.mutation(api.tasks.update, { id, status: "in_progress", agentName: "maya", workspaceSecret: WORKSPACE_SECRET });

    const activities = await t.run((ctx) => ctx.db.query("activities").collect());
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe("task_status_changed");
    expect(activities[0].agentId).toBe(agentId);
  });

  it("does not insert an activity when agentName is omitted", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedWorkspace(t, userId);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "No Activity Task", userId });

    await t.mutation(api.tasks.update, { id, status: "in_progress", workspaceSecret: WORKSPACE_SECRET });

    const activities = await t.run((ctx) => ctx.db.query("activities").collect());
    expect(activities).toHaveLength(0);
  });
});

// ── tasks:create ─────────────────────────────────────────────────────────────

describe("tasks:create", () => {
  it("creates a task with status assigned and correct assignee", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "kevin", userId);
    await t.mutation(api.tasks.create, {
      title: "Build feature",
      description: "Implement the login flow",
      assigneeNames: ["kevin"],
      workspaceSecret: WORKSPACE_SECRET,
    });
    const tasks = await t.run((ctx) => ctx.db.query("tasks").collect());
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Build feature");
    expect(tasks[0].status).toBe("assigned");
    expect(tasks[0].assigneeIds).toContain(agentId);
    expect(tasks[0].userId).toBe(userId);
  });

  it("throws when an assignee name does not exist", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedWorkspace(t, userId);
    await expect(
      t.mutation(api.tasks.create, {
        title: "Bad task",
        description: "",
        assigneeNames: ["nonexistent"],
        workspaceSecret: WORKSPACE_SECRET,
      })
    ).rejects.toThrow("Agent not found: nonexistent");
  });

  it("resolves multiple assignee names to their IDs", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const kevinId = await seedAgent(t, "kevin", userId);
    const chrisId = await seedAgent(t, "chris", userId);
    await t.mutation(api.tasks.create, {
      title: "Review and ship",
      description: "Kevin builds, Chris reviews",
      assigneeNames: ["kevin", "chris"],
      workspaceSecret: WORKSPACE_SECRET,
    });
    const tasks = await t.run((ctx) => ctx.db.query("tasks").collect());
    expect(tasks[0].assigneeIds).toContain(kevinId);
    expect(tasks[0].assigneeIds).toContain(chrisId);
  });

  it("resolves createdByName to an agent ID when provided", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const sarahId = await seedAgent(t, "sarah", userId);
    const kevinId = await seedAgent(t, "kevin", userId);
    await t.mutation(api.tasks.create, {
      title: "Delegated task",
      description: "From Sarah",
      assigneeNames: ["kevin"],
      createdByName: "sarah",
      workspaceSecret: WORKSPACE_SECRET,
    });
    const tasks = await t.run((ctx) => ctx.db.query("tasks").collect());
    expect(tasks[0].createdById).toBe(sarahId);
    expect(tasks[0].assigneeIds).toContain(kevinId);
  });

  it("throws when createdByName does not exist", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedAgent(t, "kevin", userId);
    await expect(
      t.mutation(api.tasks.create, {
        title: "Bad creator",
        description: "",
        assigneeNames: ["kevin"],
        createdByName: "ghost",
        workspaceSecret: WORKSPACE_SECRET,
      })
    ).rejects.toThrow("Agent not found: ghost");
  });

  it("works without createdByName", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedAgent(t, "kevin", userId);
    await t.mutation(api.tasks.create, {
      title: "Anonymous task",
      description: "",
      assigneeNames: ["kevin"],
      workspaceSecret: WORKSPACE_SECRET,
    });
    const tasks = await t.run((ctx) => ctx.db.query("tasks").collect());
    expect(tasks[0].createdById).toBeUndefined();
  });

  it("inserts a task_assigned activity for each assignee", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedAgent(t, "kevin", userId);
    await seedAgent(t, "chris", userId);
    await t.mutation(api.tasks.create, {
      title: "Team task",
      description: "",
      assigneeNames: ["kevin", "chris"],
      workspaceSecret: WORKSPACE_SECRET,
    });

    const activities = await t.run((ctx) => ctx.db.query("activities").collect());
    const assigned = activities.filter((a) => a.type === "task_assigned");
    expect(assigned).toHaveLength(2);
  });

  it("inserts a task_created activity when createdByName is provided", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedAgent(t, "sarah", userId);
    await seedAgent(t, "kevin", userId);
    await t.mutation(api.tasks.create, {
      title: "Delegated",
      description: "",
      assigneeNames: ["kevin"],
      createdByName: "sarah",
      workspaceSecret: WORKSPACE_SECRET,
    });

    const activities = await t.run((ctx) => ctx.db.query("activities").collect());
    const created = activities.filter((a) => a.type === "task_created");
    expect(created).toHaveLength(1);
    expect(created[0].message).toContain("Delegated");
  });

  it("does not insert a task_created activity when createdByName is omitted", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    await seedAgent(t, "kevin", userId);
    await t.mutation(api.tasks.create, {
      title: "No creator",
      description: "",
      assigneeNames: ["kevin"],
      workspaceSecret: WORKSPACE_SECRET,
    });

    const activities = await t.run((ctx) => ctx.db.query("activities").collect());
    const created = activities.filter((a) => a.type === "task_created");
    expect(created).toHaveLength(0);
  });
});

// ── tasks:update (cross-user rejection) ──────────────────────────────────────

describe("tasks:update (cross-user)", () => {
  it("rejects a task ID that belongs to a different workspace/user", async () => {
    const t = convexTest(schema, modules);
    const ownerUserId = await seedUser(t);
    const attackerUserId = await seedUser(t);
    await seedWorkspace(t, ownerUserId, "owner-secret");
    await seedWorkspace(t, attackerUserId, "attacker-secret");
    const taskId = await seedTask(t, { status: "assigned", assigneeIds: [], userId: ownerUserId });

    await expect(
      t.mutation(api.tasks.update, {
        id: taskId,
        status: "done",
        workspaceSecret: "attacker-secret",
      })
    ).rejects.toThrow("Task not found");
  });

  it("rejects an invalid workspace secret entirely", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const taskId = await seedTask(t, { status: "inbox", assigneeIds: [], userId });

    await expect(
      t.mutation(api.tasks.update, {
        id: taskId,
        status: "done",
        workspaceSecret: "nonexistent-secret",
      })
    ).rejects.toThrow("Workspace not found");
  });
});

// ── tasks:create (cross-user rejection) ──────────────────────────────────────

describe("tasks:create (cross-user)", () => {
  it("rejects when workspace secret belongs to user A but agent belongs to user B", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    await seedAgent(t, "maya", userAId, "user-a-secret");
    await seedWorkspace(t, userBId, "user-b-secret");

    await expect(
      t.mutation(api.tasks.create, {
        title: "Cross-user task",
        description: "",
        assigneeNames: ["maya"],
        workspaceSecret: "user-b-secret",
      })
    ).rejects.toThrow("Agent not found: maya");
  });
});

// ── tasks:assign ─────────────────────────────────────────────────────────────

describe("tasks:assign", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], userId });
    const agentId = await seedAgent(t, "Atlas", userId);
    await expect(
      t.mutation(api.tasks.assign, { id, assigneeIds: [agentId] })
    ).rejects.toThrow("Not authenticated");
  });

  it("throws when authenticated as a different user", async () => {
    const t = convexTest(schema, modules);
    const ownerUserId = await seedUser(t);
    const otherUserId = await seedUser(t);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], userId: ownerUserId });
    const agentId = await seedAgent(t, "Atlas", ownerUserId);

    await expect(
      t.withIdentity({ subject: otherUserId }).mutation(api.tasks.assign, { id, assigneeIds: [agentId] })
    ).rejects.toThrow("Task not found");
  });

  it("patches assigneeIds on the task when authenticated as the owner", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedTask(t, { status: "inbox", assigneeIds: [], title: "Assign Me", userId });
    const agentId = await seedAgent(t, "Atlas", userId);
    await t.withIdentity({ subject: userId }).mutation(api.tasks.assign, {
      id,
      assigneeIds: [agentId],
    });
    const task = await t.run((ctx) => ctx.db.get(id));
    expect(task!.assigneeIds).toContain(agentId);
  });
});
