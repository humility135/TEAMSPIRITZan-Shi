import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  refId: text("ref_id").notNull(),
  amount: integer("amount").notNull(),
  feeAmount: integer("fee_amount").notNull().default(0),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export type OrderRow = typeof ordersTable.$inferSelect;
