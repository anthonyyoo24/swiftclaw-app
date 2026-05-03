import { mutation } from "./_generated/server";

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "notifications",
      "taskMessages",
      "activities",
      "documents",
      "tasks",
      "agents",
    ] as const;
    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
    }
  },
});
