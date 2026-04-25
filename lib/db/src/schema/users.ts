import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type SeasonStats = {
  goals: number; assists: number; attendance: number;
  yellow: number; red: number; matches: number;
};

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url").notNull().default(""),
  tokensBalance: integer("tokens_balance").notNull().default(0),
  subscription: text("subscription").notNull().default("free"),
  seasonStatsByTeam: jsonb("season_stats_by_team").$type<Record<string, SeasonStats>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
