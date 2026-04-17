import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db.query("tasks").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// No auth required — resolves assigneeNames/createdByName to IDs internally.
// Derives status from whether assignees are provided.
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    assigneeNames: v.array(v.string()),
    createdByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resolveId = async (name: string) => {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_name", (q) => q.eq("name", name))
        .unique();
      if (!agent) throw new Error(`Agent not found: ${name}`);
      return agent._id;
    };
    const assigneeIds = await Promise.all(args.assigneeNames.map(resolveId));
    const createdById = args.createdByName
      ? await resolveId(args.createdByName)
      : undefined;
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: assigneeIds.length > 0 ? "assigned" as const : "inbox" as const,
      assigneeIds,
      createdById,
      createdAt: now,
      updatedAt: now,
    });
    if (assigneeIds.length > 0) {
      await Promise.all(assigneeIds.map((agentId) =>
        ctx.db.insert("activities", {
          type: "task_assigned",
          agentId,
          message: `Task "${args.title}" was assigned.`,
          relatedTaskId: taskId,
          createdAt: now,
        })
      ));
    }
    if (createdById) {
      await ctx.db.insert("activities", {
        type: "task_created",
        agentId: createdById,
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
  args: { agentName: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.agentName))
      .unique();
    if (!agent) return null;

    const assignedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "assigned"))
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
    const { id, agentName, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    if (agentName) {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_name", (q) => q.eq("name", agentName))
        .unique();
      if (agent) {
        await ctx.db.insert("activities", {
          type: "task_status_changed",
          agentId: agent._id,
          message: `Task status changed to "${args.status}".`,
          relatedTaskId: id,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const assign = mutation({
  args: {
    id: v.id("tasks"),
    assigneeIds: v.array(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, {
      assigneeIds: args.assigneeIds,
      updatedAt: Date.now(),
    });
  },
});
