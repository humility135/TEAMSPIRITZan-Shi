import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teamMessagesTable = sqliteTable("team_messages", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type TeamMessageRow = typeof teamMessagesTable.$inferSelect;
