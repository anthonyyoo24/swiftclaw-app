import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

export const workspaceSecretArg = v.string();

type Ctx = QueryCtx | MutationCtx;

export async function getWorkspaceBySecret(
  ctx: Ctx,
  workspaceSecret: string
): Promise<Doc<"workspaces">> {
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_workspaceSecret", (q) => q.eq("workspaceSecret", workspaceSecret))
    .unique();
  if (!workspace) throw new Error("Workspace not found");
  return workspace;
}

export async function getOrCreateWorkspace(
  ctx: MutationCtx,
  userId: Id<"users">,
  workspaceSecret: string
): Promise<Id<"workspaces">> {
  const existing = await ctx.db
    .query("workspaces")
    .withIndex("by_workspaceSecret", (q) => q.eq("workspaceSecret", workspaceSecret))
    .unique();

  const now = Date.now();
  if (existing) {
    if (existing.userId !== userId) throw new Error("Workspace already belongs to another user");
    await ctx.db.patch(existing._id, { updatedAt: now });
    return existing._id;
  }

  return await ctx.db.insert("workspaces", {
    userId,
    workspaceSecret,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getWorkspaceAgentByName(
  ctx: Ctx,
  workspaceId: Id<"workspaces">,
  name: string
): Promise<Doc<"agents">> {
  const agent = await ctx.db
    .query("agents")
    .withIndex("by_workspaceId_and_name", (q) =>
      q.eq("workspaceId", workspaceId).eq("name", name)
    )
    .unique();
  if (!agent) throw new Error(`Agent not found: ${name}`);
  return agent;
}

export async function getUserAgentByName(
  ctx: Ctx,
  userId: Id<"users">,
  name: string
): Promise<Doc<"agents">> {
  const agent = await ctx.db
    .query("agents")
    .withIndex("by_userId_and_name", (q) => q.eq("userId", userId).eq("name", name))
    .unique();
  if (!agent) throw new Error(`Agent not found: ${name}`);
  return agent;
}
