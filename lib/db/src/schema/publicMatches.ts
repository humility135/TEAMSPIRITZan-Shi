import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/sqlite-core";
import type { SlotOffer } from "./events";

export const publicMatchesTable = sqliteTable("public_matches", {
  id: text("id").primaryKey(),
  hostId: text("host_id").notNull(),
  venueId: text("venue_id"),
  venueAddress: text("venue_address"),
  datetime: integer("datetime", { mode: "timestamp" }).notNull(),
  endDatetime: integer("end_datetime", { mode: "timestamp" }),
  fee: integer("fee").notNull().default(0),
  surface: text("surface").notNull(),
  skillLevel: integer("skill_level").notNull().default(3),
  maxPlayers: integer("max_players"),
  attendees: text("attendees", { mode: "json" }).notNull().default(sql`'[]'`),
  description: text("description").notNull().default(""),
  rules: text("rules").notNull().default(""),
  refundPolicy: text("refund_policy").notNull().default("half"),
  status: text("status").notNull().default("open"),
  cancelReason: text("cancel_reason"),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  waitlistIds: text("waitlist_ids", { mode: "json" }).notNull().default(sql`'[]'`),
  slotOffers: text("slot_offers", { mode: "json" }).$type<SlotOffer[]>().notNull().default(sql`'[]'`),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const matchCommentsTable = sqliteTable("match_comments", {
  id: text("id").primaryKey(),
  matchId: text("match_id").notNull(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type PublicMatchRow = typeof publicMatchesTable.$inferSelect;
export type MatchCommentRow = typeof matchCommentsTable.$inferSelect;
