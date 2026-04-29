import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  workspaces: defineTable({
    userId: v.id("users"),
    workspaceSecret: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_workspaceSecret", ["workspaceSecret"]),

  agents: defineTable({
    userId: v.id("users"),
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    role: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("paused")
    ),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.string(),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"])
    .index("by_workspaceId_and_name", ["workspaceId", "name"]),

  tasks: defineTable({
    userId: v.id("users"),
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
    createdById: v.optional(v.id("agents")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_userId", ["userId"])
    .index("by_userId_and_status", ["userId", "status"]),

  taskMessages: defineTable({
    userId: v.id("users"),
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("documents"))),
    createdAt: v.number(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_userId", ["userId"])
    .index("by_userId_and_taskId", ["userId", "taskId"]),

  activities: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_userId", ["userId"])
    .index("by_userId_and_agentId", ["userId", "agentId"]),

  notifications: defineTable({
    userId: v.id("users"),
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
  })
    .index("by_forAgentId", ["forAgentId"])
    .index("by_userId", ["userId"])
    .index("by_userId_and_forAgentId", ["userId", "forAgentId"]),

  documents: defineTable({
    userId: v.id("users"),
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
  })
    .index("by_taskId", ["taskId"])
    .index("by_userId", ["userId"])
    .index("by_userId_and_taskId", ["userId", "taskId"]),
});
