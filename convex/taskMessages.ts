import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByTask = query({
  args: { taskId: v.id("tasks"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return [];
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("taskMessages")
      .withIndex("by_userId_and_taskId", (q) => q.eq("userId", userId).eq("taskId", args.taskId))
      .order("asc")
      .take(limit);
  },
});

export const send = mutation({
  args: {
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Task not found");
    const fromAgent = await ctx.db.get(args.fromAgentId);
    if (!fromAgent || fromAgent.userId !== userId) throw new Error("Agent not found");
    if (args.attachments) {
      const attachments = await Promise.all(args.attachments.map((id) => ctx.db.get(id)));
      if (attachments.some((doc) => !doc || doc.userId !== userId)) {
        throw new Error("Document not found");
      }
    }
    return await ctx.db.insert("taskMessages", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});
