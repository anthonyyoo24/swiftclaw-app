import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db.query("activities").order("desc").take(limit);
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("started"),
      v.literal("blocked"),
      v.literal("completed"),
      v.literal("message")
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
