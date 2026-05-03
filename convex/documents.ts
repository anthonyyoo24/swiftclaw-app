import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getWorkspaceAgentByName, getWorkspaceBySecret, workspaceSecretArg } from "./workspaceAuth";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("documents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});

// No auth required — resolves agentName to createdById internally.
// Derives userId from the agent record.
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
    agentName: v.string(),
    workspaceSecret: workspaceSecretArg,
  },
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceBySecret(ctx, args.workspaceSecret);
    const agent = await getWorkspaceAgentByName(ctx, workspace._id, args.agentName);
    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task || task.userId !== workspace.userId) throw new Error("Task not found");
    }
    const now = Date.now();
    const docId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      type: args.type,
      taskId: args.taskId,
      createdById: agent._id,
      userId: agent.userId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      type: "document_created",
      agentId: agent._id,
      userId: agent.userId,
      message: `"${args.title}" was published.`,
      relatedTaskId: args.taskId,
      relatedDocumentId: docId,
      createdAt: now,
    });
    return docId;
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return [];
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("documents")
      .withIndex("by_userId_and_taskId", (q) => q.eq("userId", userId).eq("taskId", args.taskId))
      .order("desc")
      .take(limit);
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) throw new Error("Document not found");
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error(`Document ${args.id} not found`);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});
