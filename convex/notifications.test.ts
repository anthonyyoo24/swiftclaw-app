/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedUser(t: ReturnType<typeof convexTest>) {
  return t.run((ctx) => ctx.db.insert("users", {}));
}

async function seedAgent(
  t: ReturnType<typeof convexTest>,
  name: string,
  userId: string
) {
  return t.run((ctx) =>
    ctx.db.insert("agents", {
      name,
      role: "agent",
      status: "idle" as const,
      sessionKey: `session-${name}`,
      userId: userId as never,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  );
}

async function seedTask(
  t: ReturnType<typeof convexTest>,
  userId: string,
  title = "Test Task"
) {
  return t.run((ctx) =>
    ctx.db.insert("tasks", {
      title,
      description: "desc",
      status: "assigned",
      assigneeIds: [],
      userId: userId as never,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  );
}

async function seedNotification(
  t: ReturnType<typeof convexTest>,
  userId: string,
  forAgentId: string,
  fromAgentId: string
) {
  return t.run((ctx) =>
    ctx.db.insert("notifications", {
      forAgentId: forAgentId as never,
      fromAgentId: fromAgentId as never,
      type: "mention",
      content: "test",
      delivered: false,
      userId: userId as never,
      createdAt: Date.now(),
    })
  );
}

// ── notifications:listForAgent ────────────────────────────────────────────────

describe("notifications:listForAgent", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    await expect(
      t.query(api.notifications.listForAgent, { forAgentId: agentId })
    ).rejects.toThrow("Not authenticated");
  });

  it("returns only the authenticated user's notifications", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const agentA = await seedAgent(t, "maya", userAId);
    const agentA2 = await seedAgent(t, "jack", userAId);
    const agentB = await seedAgent(t, "maya", userBId);
    const agentB2 = await seedAgent(t, "jack", userBId);
    await seedNotification(t, userAId, agentA, agentA2);
    await seedNotification(t, userBId, agentB, agentB2);

    const authedA = t.withIdentity({ subject: userAId });
    const notifications = await authedA.query(api.notifications.listForAgent, { forAgentId: agentA });
    expect(notifications).toHaveLength(1);
  });

  it("returns empty array for cross-user agent ID", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const agentB = await seedAgent(t, "maya", userBId);
    const agentB2 = await seedAgent(t, "jack", userBId);
    await seedNotification(t, userBId, agentB, agentB2);

    const authedA = t.withIdentity({ subject: userAId });
    const notifications = await authedA.query(api.notifications.listForAgent, { forAgentId: agentB });
    expect(notifications).toHaveLength(0);
  });
});

// ── notifications:create ──────────────────────────────────────────────────────

describe("notifications:create", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    const agent2Id = await seedAgent(t, "jack", userId);
    await expect(
      t.mutation(api.notifications.create, {
        forAgentId: agentId,
        fromAgentId: agent2Id,
        type: "mention",
        content: "test",
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("creates a notification for the authenticated user's agents", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agentId = await seedAgent(t, "maya", userId);
    const agent2Id = await seedAgent(t, "jack", userId);

    const id = await t.withIdentity({ subject: userId }).mutation(api.notifications.create, {
      forAgentId: agentId,
      fromAgentId: agent2Id,
      type: "mention",
      content: "Hey maya!",
    });

    expect(id).toBeDefined();
    const notification = await t.run((ctx) => ctx.db.get(id));
    expect(notification?.userId).toBe(userId);
    expect(notification?.delivered).toBe(false);
  });

  it("rejects cross-user forAgentId", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const agentA = await seedAgent(t, "maya", userAId);
    const agentB = await seedAgent(t, "jack", userBId);

    await expect(
      t.withIdentity({ subject: userAId }).mutation(api.notifications.create, {
        forAgentId: agentB,
        fromAgentId: agentA,
        type: "mention",
        content: "exploit",
      })
    ).rejects.toThrow("Agent not found");
  });

  it("rejects cross-user fromAgentId", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const agentA = await seedAgent(t, "maya", userAId);
    const agentB = await seedAgent(t, "jack", userBId);

    await expect(
      t.withIdentity({ subject: userAId }).mutation(api.notifications.create, {
        forAgentId: agentA,
        fromAgentId: agentB,
        type: "mention",
        content: "exploit",
      })
    ).rejects.toThrow("Agent not found");
  });

  it("rejects cross-user taskId", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const agentA = await seedAgent(t, "maya", userAId);
    const agentA2 = await seedAgent(t, "jack", userAId);
    const taskB = await seedTask(t, userBId);

    await expect(
      t.withIdentity({ subject: userAId }).mutation(api.notifications.create, {
        forAgentId: agentA,
        fromAgentId: agentA2,
        type: "assignment",
        content: "assigned",
        taskId: taskB,
      })
    ).rejects.toThrow("Task not found");
  });
});

// ── notifications:markDelivered ───────────────────────────────────────────────

describe("notifications:markDelivered", () => {
  it("throws when called without authentication", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agent1 = await seedAgent(t, "maya", userId);
    const agent2 = await seedAgent(t, "jack", userId);
    const notificationId = await seedNotification(t, userId, agent1, agent2);
    await expect(
      t.mutation(api.notifications.markDelivered, { id: notificationId })
    ).rejects.toThrow("Not authenticated");
  });

  it("marks notification as delivered for the owner", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const agent1 = await seedAgent(t, "maya", userId);
    const agent2 = await seedAgent(t, "jack", userId);
    const notificationId = await seedNotification(t, userId, agent1, agent2);

    await t.withIdentity({ subject: userId }).mutation(api.notifications.markDelivered, {
      id: notificationId,
    });

    const notification = await t.run((ctx) => ctx.db.get(notificationId));
    expect(notification?.delivered).toBe(true);
  });

  it("rejects cross-user notification ID", async () => {
    const t = convexTest(schema, modules);
    const userAId = await seedUser(t);
    const userBId = await seedUser(t);
    const agentB1 = await seedAgent(t, "maya", userBId);
    const agentB2 = await seedAgent(t, "jack", userBId);
    const notificationId = await seedNotification(t, userBId, agentB1, agentB2);

    await expect(
      t.withIdentity({ subject: userAId }).mutation(api.notifications.markDelivered, {
        id: notificationId,
      })
    ).rejects.toThrow("Notification not found");
  });
});
