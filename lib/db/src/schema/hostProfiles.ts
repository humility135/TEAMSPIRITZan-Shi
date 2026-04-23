import { pgTable, text, integer, real, jsonb } from "drizzle-orm/pg-core";

export type HostReview = { reviewerId: string; rating: number; comment: string; date: string };

export const hostProfilesTable = pgTable("host_profiles", {
  userId: text("user_id").primaryKey(),
  hostedCount: integer("hosted_count").notNull().default(0),
  punctualityRate: real("punctuality_rate").notNull().default(100),
  averageRating: real("average_rating").notNull().default(5),
  reviews: jsonb("reviews").$type<HostReview[]>().notNull().default([]),
});

export type HostProfileRow = typeof hostProfilesTable.$inferSelect;
