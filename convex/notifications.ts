import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listForAgent = query({
  args: { forAgentId: v.id("agents"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const agent = await ctx.db.get(args.forAgentId);
    if (!agent || agent.userId !== userId) return [];
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_forAgentId", (q) => q.eq("userId", userId).eq("forAgentId", args.forAgentId))
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
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const [forAgent, fromAgent] = await Promise.all([
      ctx.db.get(args.forAgentId),
      ctx.db.get(args.fromAgentId),
    ]);
    if (!forAgent || forAgent.userId !== userId || !fromAgent || fromAgent.userId !== userId) {
      throw new Error("Agent not found");
    }
    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task || task.userId !== userId) throw new Error("Task not found");
    }
    return await ctx.db.insert("notifications", {
      ...args,
      userId,
      delivered: false,
      createdAt: Date.now(),
    });
  },
});

export const markDelivered = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== userId) throw new Error("Notification not found");
    await ctx.db.patch(args.id, { delivered: true });
  },
});
