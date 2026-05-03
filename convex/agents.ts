import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getOrCreateWorkspace, workspaceSecretArg } from "./workspaceAuth";

export const get = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db
      .query("agents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const agent = await ctx.db.get(args.id);
    if (!agent || agent.userId !== userId) return null;
    return agent;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("paused")
    ),
    sessionKey: v.string(),
    avatar: v.optional(v.string()),
    workspaceSecret: v.optional(workspaceSecretArg),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const workspaceId = args.workspaceSecret
      ? await getOrCreateWorkspace(ctx, userId, args.workspaceSecret)
      : undefined;
    const now = Date.now();
    return await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      status: args.status,
      sessionKey: args.sessionKey,
      avatar: args.avatar,
      userId,
      workspaceId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Pure update — only patches an existing agent found by name.
// Seeding is owned by registerAgents; this is called by the gateway on agent wake.
export const syncAgent = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    sessionKey: v.string(),
    status: v.optional(
      v.union(
        v.literal("idle"),
        v.literal("active"),
        v.literal("blocked"),
        v.literal("paused")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_userId_and_name", (q) => q.eq("userId", userId).eq("name", args.name))
      .first();

    if (!existing) return null;

    // Preserve "paused" state — if no explicit status is provided and the agent
    // is currently paused, don't flip it to "active" (e.g. from a stray cron run).
    const status = args.status ?? (existing.status === "paused" ? "paused" : "active");

    await ctx.db.patch(existing._id, {
      sessionKey: args.sessionKey,
      role: args.role,
      status,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

// Seeds Convex with all agents configured at deployment time.
// Idempotent — skips agents that already exist (e.g. on re-deploy).
export const registerAgents = mutation({
  args: {
    agents: v.array(v.object({ name: v.string(), role: v.string() })),
    workspaceSecret: workspaceSecretArg,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const workspaceId = await getOrCreateWorkspace(ctx, userId, args.workspaceSecret);
    const now = Date.now();
    await Promise.all(
      args.agents.map(async ({ name, role }) => {
        const existing = await ctx.db
          .query("agents")
          .withIndex("by_userId_and_name", (q) =>
            q.eq("userId", userId).eq("name", name)
          )
          .first();
        if (existing) {
          await ctx.db.patch(existing._id, {
            role,
            workspaceId,
            updatedAt: now,
          });
          return;
        }
        await ctx.db.insert("agents", {
          name,
          role,
          status: "idle",
          sessionKey: `pending:${name}`,
          userId,
          workspaceId,
          createdAt: now,
          updatedAt: now,
        });
      })
    );
  },
});

// Marks all currently active agents as idle.
// Called when the gateway disconnects so status reflects reality.
export const setAllIdle = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(200);
    const now = Date.now();
    await Promise.all(
      agents
        .filter((a) => a.status === "active")
        .map((a) => ctx.db.patch(a._id, { status: "idle", updatedAt: now }))
    );
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("paused")
    ),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const agent = await ctx.db.get(args.id);
    if (!agent || agent.userId !== userId) throw new Error("Agent not found");
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});
