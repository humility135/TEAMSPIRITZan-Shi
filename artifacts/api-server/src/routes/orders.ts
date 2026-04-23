import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!o || o.userId !== me.id) { res.status(404).json({ error: "Not found" }); return; }
  res.json(o);
});

export default router;
