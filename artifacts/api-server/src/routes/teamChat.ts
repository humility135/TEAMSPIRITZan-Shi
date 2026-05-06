import { Router, type IRouter } from "express";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db, teamMessagesTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { newId } from "../lib/ids";
import { requireTeamMember } from "../lib/teamAuth";
import { broadcast } from "../lib/teamChatHub";

const router: IRouter = Router();

router.get("/teams/:teamId/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const teamId = String(req.params.teamId);

  const ok = await requireTeamMember(teamId, me.id);
  if (!ok) { res.status(403).json({ error: "Forbidden" }); return; }

  const rawLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 100) : 50;
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  let cursorCreatedAt: string | undefined;
  if (cursor) {
    const [c] = await db.select().from(teamMessagesTable)
      .where(and(eq(teamMessagesTable.teamId, teamId), eq(teamMessagesTable.id, cursor)));
    if (!c) { res.status(400).json({ error: "Invalid cursor" }); return; }
    cursorCreatedAt = c.createdAt;
  }

  const whereClause = cursor && cursorCreatedAt
    ? and(
        eq(teamMessagesTable.teamId, teamId),
        or(
          lt(teamMessagesTable.createdAt, cursorCreatedAt),
          and(eq(teamMessagesTable.createdAt, cursorCreatedAt), lt(teamMessagesTable.id, cursor)),
        ),
      )
    : eq(teamMessagesTable.teamId, teamId);

  const rowsDesc = await db.select().from(teamMessagesTable)
    .where(whereClause)
    .orderBy(desc(teamMessagesTable.createdAt), desc(teamMessagesTable.id))
    .limit(limit);

  res.json(rowsDesc.reverse());
});

router.post("/teams/:teamId/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const teamId = String(req.params.teamId);

  const ok = await requireTeamMember(teamId, me.id);
  if (!ok) { res.status(403).json({ error: "Forbidden" }); return; }

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) { res.status(400).json({ error: "Empty message" }); return; }
  if (text.length > 1000) { res.status(400).json({ error: "Message too long" }); return; }

  const [row] = await db.insert(teamMessagesTable).values({
    id: newId("tm"),
    teamId,
    userId: me.id,
    text,
  }).returning();

  broadcast(teamId, JSON.stringify({ type: "message", payload: row }));
  res.status(201).json(row);
});

export default router;
