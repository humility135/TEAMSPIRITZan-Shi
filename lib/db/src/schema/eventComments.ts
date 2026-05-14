import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const eventCommentsTable = sqliteTable("event_comments", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type EventCommentRow = typeof eventCommentsTable.$inferSelect;
