import { Router, type IRouter } from "express";
import { db, hostProfilesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/host-profiles", async (_req, res): Promise<void> => {
  const rows = await db.select().from(hostProfilesTable);
  res.json(rows);
});

export default router;
