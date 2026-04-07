import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked")
    ),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.string(),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    assigneeIds: v.array(v.id("agents")),
    createdById: v.id("agents"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  taskMessages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("documents"))),
    createdAt: v.number(),
  }),

  activities: defineTable({
    type: v.string(),
    agentId: v.id("agents"),
    message: v.string(),
    relatedTaskId: v.optional(v.id("tasks")),
    relatedDocumentId: v.optional(v.id("documents")),
    createdAt: v.number(),
  }),

  notifications: defineTable({
    forAgentId: v.id("agents"),
    fromAgentId: v.id("agents"),
    type: v.union(
      v.literal("mention"),
      v.literal("assignment"),
      v.literal("review_request")
    ),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    delivered: v.boolean(),
    createdAt: v.number(),
  }),

  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("general")
    ),
    taskId: v.optional(v.id("tasks")),
    createdById: v.id("agents"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
