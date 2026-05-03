import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getWorkspaceBySecret, workspaceSecretArg } from "./workspaceAuth";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const limit = Math.min(args.limit ?? 50, 200);
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    return await Promise.all(
      activities.map(async (activity) => {
        const agent = await ctx.db.get(activity.agentId);
        const name = agent?.name ?? "";
        return {
          ...activity,
          agentName: name
            ? name.charAt(0).toUpperCase() + name.slice(1)
            : "Unknown Agent",
        };
      })
    );
  },
});

// Agent-callable — derives userId from the referenced agent record.
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
    workspaceSecret: v.optional(workspaceSecretArg),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const workspace = args.workspaceSecret
      ? await getWorkspaceBySecret(ctx, args.workspaceSecret)
      : null;
    const userId = workspace?.userId ?? authUserId;
    if (userId === null) throw new Error("Not authenticated");

    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.userId !== userId) throw new Error("Agent not found");
    if (args.relatedTaskId) {
      const task = await ctx.db.get(args.relatedTaskId);
      if (!task || task.userId !== userId) throw new Error("Task not found");
    }
    if (args.relatedDocumentId) {
      const document = await ctx.db.get(args.relatedDocumentId);
      if (!document || document.userId !== userId) throw new Error("Document not found");
    }
    return await ctx.db.insert("activities", {
      type: args.type,
      agentId: args.agentId,
      message: args.message,
      relatedTaskId: args.relatedTaskId,
      relatedDocumentId: args.relatedDocumentId,
      userId,
      createdAt: Date.now(),
    });
  },
});
