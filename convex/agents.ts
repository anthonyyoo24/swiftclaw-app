import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db.query("agents").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked")
    ),
    sessionKey: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("agents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const syncAgent = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sessionKey: args.sessionKey,
        role: args.role,
        status: "active",
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      sessionKey: args.sessionKey,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked")
    ),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});
