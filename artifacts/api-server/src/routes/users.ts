import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  res.json(users);
});

const UpdateMeBody = z.object({
  name: z.string().min(1).max(40).optional(),
  avatarUrl: z.string().optional(),
});

router.patch("/me/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const me = (req as AuthedRequest).user;
  const [updated] = await db.update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, me.id))
    .returning();
  res.json(updated);
});

router.post("/me/pro-toggle", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const next = me.subscription === "pro" ? "free" : "pro";
  const [updated] = await db.update(usersTable)
    .set({ subscription: next })
    .where(eq(usersTable.id, me.id))
    .returning();
  res.json(updated);
});

export default router;
