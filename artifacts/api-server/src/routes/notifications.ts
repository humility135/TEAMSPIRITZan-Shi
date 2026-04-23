import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const rows = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, me.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);
  res.json(rows);
});

router.post("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  await db.update(notificationsTable).set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, me.id)));
  res.json({ ok: true });
});

export default router;
