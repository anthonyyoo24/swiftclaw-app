import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  getUserAgentByName,
  getWorkspaceAgentByName,
  getWorkspaceBySecret,
  workspaceSecretArg,
} from "./workspaceAuth";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) return null;
    return task;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) throw new Error("Task not found");
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) throw new Error("Task not found");
    await ctx.db.delete(args.id);
  },
});

// No auth required — resolves assigneeNames/createdByName to IDs internally.
// Agent calls must include workspaceSecret; dashboard calls use Convex auth.
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    assigneeNames: v.array(v.string()),
    createdByName: v.optional(v.string()),
    workspaceSecret: v.optional(workspaceSecretArg),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const workspace = args.workspaceSecret
      ? await getWorkspaceBySecret(ctx, args.workspaceSecret)
      : null;
    const userId = workspace?.userId ?? authUserId;
    if (userId === null) throw new Error("Not authenticated");

    const resolveAgent = async (name: string) => {
      return workspace
        ? getWorkspaceAgentByName(ctx, workspace._id, name)
        : getUserAgentByName(ctx, userId, name);
    };

    const assignees = await Promise.all(args.assigneeNames.map(resolveAgent));
    const creator = args.createdByName
      ? await resolveAgent(args.createdByName)
      : undefined;

    const sourceAgent = assignees[0] ?? creator;
    if (sourceAgent && sourceAgent.userId !== userId) throw new Error("Agent not found");

    const assigneeIds = assignees.map((a) => a._id);
    const createdById = creator?._id;
    const now = Date.now();

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: assigneeIds.length > 0 ? "assigned" as const : "inbox" as const,
      assigneeIds,
      createdById,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    if (assigneeIds.length > 0) {
      await Promise.all(
        assignees.map((agent) =>
          ctx.db.insert("activities", {
            type: "task_assigned",
            agentId: agent._id,
            userId: agent.userId,
            message: `Task "${args.title}" was assigned.`,
            relatedTaskId: taskId,
            createdAt: now,
          })
        )
      );
    }

    if (creator) {
      await ctx.db.insert("activities", {
        type: "task_created",
        agentId: creator._id,
        userId: creator.userId,
        message: `Task "${args.title}" was created.`,
        relatedTaskId: taskId,
        createdAt: now,
      });
    }

    return taskId;
  },
});

// Returns the oldest assigned task for a given agent name, or null if none.
// Used by agent heartbeats — no user auth required.
export const getAssigned = query({
  args: { agentName: v.string(), workspaceSecret: workspaceSecretArg },
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceBySecret(ctx, args.workspaceSecret);
    const agent = await getWorkspaceAgentByName(ctx, workspace._id, args.agentName);

    const assignedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId_and_status", (q) =>
        q.eq("userId", agent.userId).eq("status", "assigned")
      )
      .order("asc")
      .take(100);

    return assignedTasks.find((t) => t.assigneeIds.includes(agent._id)) ?? null;
  },
});

// Agent-callable status update — no user auth required.
// Agents are trusted callers; auth is enforced at the OpenClaw session level.
export const update = mutation({
  args: {
    id: v.id("tasks"),
    workspaceSecret: workspaceSecretArg,
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    agentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceBySecret(ctx, args.workspaceSecret);
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== workspace.userId) throw new Error("Task not found");
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
    if (args.agentName) {
      const agent = await getWorkspaceAgentByName(ctx, workspace._id, args.agentName);
      // Keep currentTaskId in sync so the UI status dot updates in real time.
      if (args.status === "in_progress") {
        await ctx.db.patch(agent._id, { currentTaskId: args.id, updatedAt: Date.now() });
      } else if (args.status === "done" || args.status === "assigned" || args.status === "inbox") {
        await ctx.db.patch(agent._id, { currentTaskId: undefined, updatedAt: Date.now() });
      }
      await ctx.db.insert("activities", {
        type: "task_status_changed",
        agentId: agent._id,
        userId: agent.userId,
        message: `Task status changed to "${args.status}".`,
        relatedTaskId: args.id,
        createdAt: Date.now(),
      });
    }
  },
});

export const assign = mutation({
  args: {
    id: v.id("tasks"),
    assigneeIds: v.array(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) throw new Error("Task not found");
    const assignees = await Promise.all(args.assigneeIds.map((id) => ctx.db.get(id)));
    if (assignees.some((agent) => !agent || agent.userId !== userId)) {
      throw new Error("Agent not found");
    }
    await ctx.db.patch(args.id, {
      assigneeIds: args.assigneeIds,
      updatedAt: Date.now(),
    });
  },
});
