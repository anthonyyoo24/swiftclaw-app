import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const activities = await ctx.db.query("activities").order("desc").take(limit);
    return await Promise.all(
      activities.map(async (activity) => {
        const agent = await ctx.db.get(activity.agentId);
        return { ...activity, agentName: agent?.name ?? "Unknown Agent" };
      })
    );
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("task_created"),
      v.literal("task_assigned"),
      v.literal("task_status_changed"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("document_updated")
    ),
    agentId: v.id("agents"),
    message: v.string(),
    relatedTaskId: v.optional(v.id("tasks")),
    relatedDocumentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
