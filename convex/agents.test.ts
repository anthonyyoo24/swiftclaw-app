/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("syncAgent", () => {
  it("returns null and does not insert when no agent exists with that name", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "main:session-1",
    });

    expect(result).toBeNull();
    const agents = await t.query(api.agents.get, {});
    expect(agents).toHaveLength(0);
  });

  it("patches sessionKey, role, and status when a name match is found", async () => {
    const t = convexTest(schema, modules);

    // Seed agent directly — syncAgent is a pure update, seeding is owned by registerAgents
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "session-old",
        status: "idle" as const,
        createdAt: now,
        updatedAt: now,
      });
    });

    const before = await t.query(api.agents.get, {});
    const createdAt = before[0].createdAt;

    await t.mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "session-new",
    });

    const after = await t.query(api.agents.get, {});
    expect(after).toHaveLength(1);
    expect(after[0].sessionKey).toBe("session-new");
    expect(after[0].status).toBe("active");
    expect(after[0].createdAt).toBe(createdAt);
  });

  it("does not throw when duplicate names exist, and patches the first match", async () => {
    const t = convexTest(schema, modules);

    // Seed two agents with identical names directly to simulate a pre-existing
    // duplicate state (e.g. from manual create() calls)
    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "session-a",
        status: "idle" as const,
        createdAt: now - 1000,
        updatedAt: now - 1000,
      });
      await ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "session-b",
        status: "idle" as const,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Must resolve without error (would have thrown with .unique() before the fix)
    await expect(
      t.mutation(api.agents.syncAgent, {
        name: "Atlas",
        role: "agent",
        sessionKey: "session-synced",
      })
    ).resolves.toBeDefined();

    const all = await t.query(api.agents.get, {});
    expect(all).toHaveLength(2);
    const patched = all.find((a) => a.sessionKey === "session-synced");
    expect(patched).toBeDefined();
    expect(patched!.status).toBe("active");
  });

  it("preserves paused status when no explicit status is provided", async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const id = await t.run((ctx) =>
      ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "old-key",
        status: "paused" as const,
        createdAt: now,
        updatedAt: now,
      })
    );

    await t.mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "new-key",
      // no status — agent is paused, should not be flipped to active
    });

    const agent = await t.run((ctx) => ctx.db.get(id));
    expect(agent?.status).toBe("paused");
  });

  it("overrides paused status when an explicit status is given", async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const id = await t.run((ctx) =>
      ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "old-key",
        status: "paused" as const,
        createdAt: now,
        updatedAt: now,
      })
    );

    await t.mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "new-key",
      status: "active",
    });

    const agent = await t.run((ctx) => ctx.db.get(id));
    expect(agent?.status).toBe("active");
  });
});

// ── updateStatus ──────────────────────────────────────────────────────────────

describe("agents:updateStatus", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const id = await t.run((ctx) =>
      ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "key",
        status: "active" as const,
        createdAt: now,
        updatedAt: now,
      })
    );

    await expect(
      t.mutation(api.agents.updateStatus, { id, status: "paused" })
    ).rejects.toThrow("Not authenticated");
  });

  it("patches the agent status when authenticated", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const id = await t.run((ctx) =>
      ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "key",
        status: "active" as const,
        createdAt: now,
        updatedAt: now,
      })
    );

    await t.withIdentity({ name: "Test User" }).mutation(api.agents.updateStatus, {
      id,
      status: "paused",
    });

    const agent = await t.run((ctx) => ctx.db.get(id));
    expect(agent?.status).toBe("paused");
  });

  it("can resume a paused agent back to idle", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const id = await t.run((ctx) =>
      ctx.db.insert("agents", {
        name: "Atlas",
        role: "agent",
        sessionKey: "key",
        status: "paused" as const,
        createdAt: now,
        updatedAt: now,
      })
    );

    await t.withIdentity({ name: "Test User" }).mutation(api.agents.updateStatus, {
      id,
      status: "idle",
    });

    const agent = await t.run((ctx) => ctx.db.get(id));
    expect(agent?.status).toBe("idle");
  });
});
