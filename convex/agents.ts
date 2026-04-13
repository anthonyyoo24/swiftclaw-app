import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return await ctx.db.query("agents").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked")
    ),
    sessionKey: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("agents", {
      ...args,
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
      v.union(v.literal("idle"), v.literal("active"), v.literal("blocked"))
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (!existing) return null;

    await ctx.db.patch(existing._id, {
      sessionKey: args.sessionKey,
      role: args.role,
      status: args.status ?? "active",
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    await Promise.all(
      args.agents.map(async ({ name, role }) => {
        const existing = await ctx.db
          .query("agents")
          .withIndex("by_name", (q) => q.eq("name", name))
          .first();
        if (!existing) {
          await ctx.db.insert("agents", {
            name,
            role,
            status: "idle",
            sessionKey: `pending:${name}`,
            createdAt: now,
            updatedAt: now,
          });
        }
      })
    );
  },
});

// Marks all currently active agents as idle.
// Called when the gateway disconnects so status reflects reality.
export const setAllIdle = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const agents = await ctx.db.query("agents").take(200);
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
      v.literal("blocked")
    ),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});
