import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, jsonb } from "drizzle-orm/sqlite-core";

export type HostReview = { reviewerId: string; rating: number; comment: string; date: string };

export const hostProfilesTable = sqliteTable("host_profiles", {
  userId: text("user_id").primaryKey(),
  hostedCount: integer("hosted_count").notNull().default(0),
  punctualityRate: real("punctuality_rate").notNull().default(100),
  averageRating: real("average_rating").notNull().default(5),
  reviews: text("reviews", { mode: "json" }).$type<HostReview[]>().notNull().default(sql`'[]'`),
});

export type HostProfileRow = typeof hostProfilesTable.$inferSelect;
