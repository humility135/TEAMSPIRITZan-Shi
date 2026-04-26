import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const otpCodesTable = sqliteTable("otp_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type OtpCode = typeof otpCodesTable.$inferSelect;
