import { sqliteTable, text, integer, jsonb, boolean, primaryKey } from "drizzle-orm/sqlite-core";

export type TeamRecord = { w: number; d: number; l: number; gf: number; ga: number };

export const teamsTable = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url").notNull().default(""),
  accentColor: text("accent_color").notNull().default("#84cc16"),
  district: text("district"),
  level: integer("level"),
  isPro: integer("is_pro", { mode: "boolean" }).notNull().default(false),
  inviteCode: text("invite_code"),
  record: text("record", { mode: "json" }).$type<TeamRecord>().notNull().default({ w: 0, d: 0, l: 0, gf: 0, ga: 0 }),
});

export const teamMembersTable = sqliteTable("team_members", {
  teamId: text("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.teamId, t.userId] }) }));

export type Team = typeof teamsTable.$inferSelect;
export type TeamMember = typeof teamMembersTable.$inferSelect;

export const teamMessagesTable = sqliteTable("team_messages", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teamsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type TeamMessage = typeof teamMessagesTable.$inferSelect;
