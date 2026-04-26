import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notificationsTable = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type NotificationRow = typeof notificationsTable.$inferSelect;
