/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("syncAgent", () => {
  it("inserts a new agent when none exists with that name", async () => {
    const t = convexTest(schema, modules);

    const id = await t.mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "main:session-1",
    });

    const agents = await t.query(api.agents.get, {});
    expect(agents).toHaveLength(1);
    expect(agents[0]._id).toBe(id);
    expect(agents[0].name).toBe("Atlas");
    expect(agents[0].sessionKey).toBe("main:session-1");
    expect(agents[0].role).toBe("agent");
    expect(agents[0].status).toBe("active");
  });

  it("patches sessionKey, role, and status when a name match is found", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.agents.syncAgent, {
      name: "Atlas",
      role: "agent",
      sessionKey: "session-old",
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
});
