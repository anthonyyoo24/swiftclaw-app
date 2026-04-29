import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listForAgent = query({
  args: { forAgentId: v.id("agents"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("notifications")
      .withIndex("by_forAgentId", (q) => q.eq("forAgentId", args.forAgentId))
      .order("desc")
      .take(limit);
  },
});

export const create = mutation({
  args: {
    forAgentId: v.id("agents"),
    fromAgentId: v.id("agents"),
    type: v.union(
      v.literal("mention"),
      v.literal("assignment"),
      v.literal("review_request")
    ),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("notifications", {
      ...args,
      delivered: false,
      createdAt: Date.now(),
    });
  },
});

export const markDelivered = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, { delivered: true });
  },
});
