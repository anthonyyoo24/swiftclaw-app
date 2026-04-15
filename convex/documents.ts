import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db.query("documents").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("general")
    ),
    taskId: v.optional(v.id("tasks")),
    createdById: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("documents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Agent-callable document creation — no user auth required.
// Looks up the agent by name to resolve createdById.
// Called from HEARTBEAT.md: npx convex run documents:createByAgent '{...}'
export const createByAgent = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("general")
    ),
    taskId: v.optional(v.id("tasks")),
    agentName: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.agentName))
      .unique();
    if (!agent) throw new Error(`Agent not found: ${args.agentName}`);
    const now = Date.now();
    return await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      type: args.type,
      taskId: args.taskId,
      createdById: agent._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("documents")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .take(limit);
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error(`Document ${args.id} not found`);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});
