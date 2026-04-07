import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taskMessages")
      .filter((q) => q.eq(q.field("taskId"), args.taskId))
      .order("asc")
      .collect();
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
    return await ctx.db.insert("taskMessages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
