import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { SlotOffer } from "./events";

export const publicMatchesTable = sqliteTable("public_matches", {
  id: text("id").primaryKey(),
  hostId: text("host_id").notNull(),
  venueId: text("venue_id"),
  venueAddress: text("venue_address"),
  datetime: text("datetime").notNull(),
  endDatetime: text("end_datetime"),
  fee: integer("fee").notNull().default(0),
  surface: text("surface").notNull(),
  skillLevel: integer("skill_level").notNull().default(3),
  maxPlayers: integer("max_players"),
  attendees: text("attendees", { mode: 'json' }).$type<string[]>().notNull().default([]),
  description: text("description").notNull().default(""),
  rules: text("rules").notNull().default(""),
  refundPolicy: text("refund_policy").notNull().default("half"),
  status: text("status").notNull().default("open"),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  waitlistIds: text("waitlist_ids", { mode: 'json' }).$type<string[]>().notNull().default([]),
  slotOffers: text("slot_offers", { mode: 'json' }).$type<SlotOffer[]>().notNull().default([]),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const matchCommentsTable = sqliteTable("match_comments", {
  id: text("id").primaryKey(),
  matchId: text("match_id").notNull(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type PublicMatchRow = typeof publicMatchesTable.$inferSelect;
export type MatchCommentRow = typeof matchCommentsTable.$inferSelect;
