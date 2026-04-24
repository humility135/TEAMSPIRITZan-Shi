import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, jsonb, timestamp } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type SeasonStats = {
  goals: number; assists: number; attendance: number;
  yellow: number; red: number; matches: number;
};

export const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url").notNull().default(""),
  tokensBalance: integer("tokens_balance").notNull().default(0),
  subscription: text("subscription").notNull().default("free"),
  seasonStatsByTeam: text("season_stats_by_team", { mode: "json" }).$type<Record<string, SeasonStats>>().notNull().default(sql`'{}'`),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
