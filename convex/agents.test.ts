/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const WORKSPACE_SECRET = "test-workspace-secret";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedUser(t: ReturnType<typeof convexTest>) {
  return t.run((ctx) => ctx.db.insert("users", {}));
}

async function seedWorkspace(
  t: ReturnType<typeof convexTest>,
  userId: string,
  workspaceSecret = WORKSPACE_SECRET
) {
  return t.run(async (ctx) => {
    const existing = (await ctx.db.query("workspaces").collect()).find(
      (workspace) => workspace.workspaceSecret === workspaceSecret
    );
    if (existing) return existing._id;
    const now = Date.now();
    return ctx.db.insert("workspaces", {
      userId: userId as never,
      workspaceSecret,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function seedAgentDirect(
  t: ReturnType<typeof convexTest>,
  name: string,
  userId: string,
  overrides: { status?: "idle" | "active" | "blocked" | "paused" } = {}
) {
  const now = Date.now();
  const workspaceId = await seedWorkspace(t, userId, `secret-${name}-${userId}`);
  return t.run((ctx) =>
    ctx.db.insert("agents", {
      name,
      role: "agent",
      sessionKey: `session-${name}`,
      status: overrides.status ?? ("idle" as const),
      userId: userId as never,
      workspaceId: workspaceId as never,
      createdAt: now,
      updatedAt: now,
    })
  );
}

// ── syncAgent ─────────────────────────────────────────────────────────────────

describe("syncAgent", () => {
  it("returns null and does not insert when no agent exists with that name", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    const result = await t.withIdentity({ subject: userId }).mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "main:session-1",
    });

    expect(result).toBeNull();
    const agents = await t.run((ctx) => ctx.db.query("agents").collect());
    expect(agents).toHaveLength(0);
  });

  it("patches sessionKey, role, and status when a name match is found", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedAgentDirect(t, "Atlas", userId);

    const before = await t.run((ctx) => ctx.db.get(id));
    const createdAt = before!.createdAt;

    await t.withIdentity({ subject: userId }).mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "session-new",
    });

    const after = await t.run((ctx) => ctx.db.get(id));
    expect(after!.sessionKey).toBe("session-new");
    expect(after!.status).toBe("active");
    expect(after!.createdAt).toBe(createdAt);
  });

  it("does not throw when duplicate names exist, and patches the first match", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const workspaceId = await ctx.db.insert("workspaces", {
        userId: userId as never,
        workspaceSecret: "duplicate-workspace",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "session-a",
        status: "idle" as const,
        userId: userId as never,
        workspaceId,
        createdAt: now - 1000,
        updatedAt: now - 1000,
      });
      await ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "session-b",
        status: "idle" as const,
        userId: userId as never,
        workspaceId,
        createdAt: now,
        updatedAt: now,
      });
    });

    await expect(
      t.withIdentity({ subject: userId }).mutation(api.agents.syncAgent, {
        name: "Atlas",
        role: "agent",
        sessionKey: "session-synced",
      })
    ).resolves.toBeDefined();

    const all = await t.run((ctx) => ctx.db.query("agents").collect());
    expect(all).toHaveLength(2);
    const patched = all.find((a) => a.sessionKey === "session-synced");
    expect(patched).toBeDefined();
    expect(patched!.status).toBe("active");
  });

  it("preserves paused status when no explicit status is provided", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedAgentDirect(t, "Atlas", userId, { status: "paused" });

    await t.withIdentity({ subject: userId }).mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "new-key",
    });

    const agent = await t.run((ctx) => ctx.db.get(id));
    expect(agent?.status).toBe("paused");
  });

  it("overrides paused status when an explicit status is given", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedAgentDirect(t, "Atlas", userId, { status: "paused" });

    await t.withIdentity({ subject: userId }).mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "new-key",
      status: "active",
    });

    const agent = await t.run((ctx) => ctx.db.get(id));
    expect(agent?.status).toBe("active");
  });

  it("updates only the authenticated user's agent when names collide", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const userAAgentId = await seedAgentDirect(t, "maya", userAId);
    const userBAgentId = await seedAgentDirect(t, "maya", userBId);

    await t.withIdentity({ subject: userBId }).mutation(api.agents.syncAgent, {
      name: "maya",
      role: "support",
      sessionKey: "user-b-session",
    });

    const userAAgent = await t.run((ctx) => ctx.db.get(userAAgentId));
    const userBAgent = await t.run((ctx) => ctx.db.get(userBAgentId));
    expect(userAAgent?.sessionKey).not.toBe("user-b-session");
    expect(userBAgent?.sessionKey).toBe("user-b-session");
  });
});

// ── agents:get ────────────────────────────────────────────────────────────────

describe("agents:get", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.agents.get, {})).rejects.toThrow("Not authenticated");
  });

  it("returns only the authenticated user's agents", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    await seedAgentDirect(t, "Atlas", userAId);
    await seedAgentDirect(t, "Orion", userBId);

    const agents = await t.withIdentity({ subject: userAId }).query(api.agents.get, {});
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("Atlas");
  });

  it("returns empty array when authenticated user has no agents", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agents = await t.withIdentity({ subject: userId }).query(api.agents.get, {});
    expect(agents).toHaveLength(0);
  });
});

// ── agents:updateStatus ───────────────────────────────────────────────────────

describe("agents:updateStatus", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedAgentDirect(t, "Atlas", userId, { status: "active" });

    await expect(
      t.mutation(api.agents.updateStatus, { id, status: "paused" })
    ).rejects.toThrow("Not authenticated");
  });

  it("patches the agent status when authenticated as the owner", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedAgentDirect(t, "Atlas", userId, { status: "active" });

    await t.withIdentity({ subject: userId }).mutation(api.agents.updateStatus, {
      id,
      status: "paused",
    });

    const agent = await t.run((ctx) => ctx.db.get(id));
    expect(agent?.status).toBe("paused");
  });

  it("throws when authenticated as a different user", async () => {
    const t = convexTest(schema, modules);
    const ownerUserId = await seedUser(t);
    const otherUserId = await seedUser(t);
    const id = await seedAgentDirect(t, "Atlas", ownerUserId, { status: "active" });

    await expect(
      t.withIdentity({ subject: otherUserId }).mutation(api.agents.updateStatus, {
        id,
        status: "paused",
      })
    ).rejects.toThrow("Agent not found");
  });

  it("can resume a paused agent back to idle", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const id = await seedAgentDirect(t, "Atlas", userId, { status: "paused" });

    await t.withIdentity({ subject: userId }).mutation(api.agents.updateStatus, {
      id,
      status: "idle",
    });

    const agent = await t.run((ctx) => ctx.db.get(id));
    expect(agent?.status).toBe("idle");
  });
});

// ── agents:registerAgents ─────────────────────────────────────────────────────

describe("agents:registerAgents", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.agents.registerAgents, {
        agents: [{ name: "maya", role: "PM" }],
        workspaceSecret: WORKSPACE_SECRET,
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("seeds agents with the authenticated user's userId", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    await t.withIdentity({ subject: userId }).mutation(api.agents.registerAgents, {
      agents: [
        { name: "maya", role: "PM" },
        { name: "jack", role: "Engineer" },
      ],
      workspaceSecret: WORKSPACE_SECRET,
    });

    const agents = await t.withIdentity({ subject: userId }).query(api.agents.get, {});
    expect(agents).toHaveLength(2);
    expect(agents.every((a) => a.userId === userId)).toBe(true);
  });

  it("is idempotent — does not duplicate an existing agent", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const authed = t.withIdentity({ subject: userId });

    await authed.mutation(api.agents.registerAgents, {
      agents: [{ name: "maya", role: "PM" }],
      workspaceSecret: WORKSPACE_SECRET,
    });
    await authed.mutation(api.agents.registerAgents, {
      agents: [{ name: "maya", role: "PM" }],
      workspaceSecret: WORKSPACE_SECRET,
    });

    const agents = await t.run((ctx) => ctx.db.query("agents").collect());
    expect(agents).toHaveLength(1);
  });

  it("two users can both register an agent with the same name", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);

    await t.withIdentity({ subject: userAId }).mutation(api.agents.registerAgents, {
      agents: [{ name: "maya", role: "PM" }, { name: "kevin", role: "Engineer" }],
      workspaceSecret: "user-a-secret",
    });
    await t.withIdentity({ subject: userBId }).mutation(api.agents.registerAgents, {
      agents: [{ name: "maya", role: "PM" }, { name: "kevin", role: "Engineer" }],
      workspaceSecret: "user-b-secret",
    });

    const allAgents = await t.run((ctx) => ctx.db.query("agents").collect());
    expect(allAgents).toHaveLength(4);

    const userAAgents = await t.withIdentity({ subject: userAId }).query(api.agents.get, {});
    const userBAgents = await t.withIdentity({ subject: userBId }).query(api.agents.get, {});
    expect(userAAgents).toHaveLength(2);
    expect(userBAgents).toHaveLength(2);
    expect(userAAgents.every((a) => a.userId === userAId)).toBe(true);
    expect(userBAgents.every((a) => a.userId === userBId)).toBe(true);
  });

  it("idempotency is scoped per user — does not block other users from registering same name", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);

    await t.withIdentity({ subject: userAId }).mutation(api.agents.registerAgents, {
      agents: [{ name: "maya", role: "PM" }],
      workspaceSecret: "user-a-secret",
    });
    // User B registering "maya" should create a new record, not skip it
    await t.withIdentity({ subject: userBId }).mutation(api.agents.registerAgents, {
      agents: [{ name: "maya", role: "PM" }],
      workspaceSecret: "user-b-secret",
    });
    // User B calling again should be idempotent for their own record
    await t.withIdentity({ subject: userBId }).mutation(api.agents.registerAgents, {
      agents: [{ name: "maya", role: "PM" }],
      workspaceSecret: "user-b-secret",
    });

    const allAgents = await t.run((ctx) => ctx.db.query("agents").collect());
    expect(allAgents).toHaveLength(2);
  });
});
