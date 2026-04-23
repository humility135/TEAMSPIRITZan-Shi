import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const otpCodesTable = sqliteTable("otp_codes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type OtpCode = typeof otpCodesTable.$inferSelect;