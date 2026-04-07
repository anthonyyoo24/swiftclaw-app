import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listForAgent = query({
  args: { forAgentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("forAgentId"), args.forAgentId))
      .order("desc")
      .collect();
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
    await ctx.db.patch(args.id, { delivered: true });
  },
});
