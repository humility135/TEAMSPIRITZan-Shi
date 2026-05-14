import { Router, type IRouter } from "express";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db, teamMessagesTable } from "@workspace/db";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { newId } from "../lib/ids";
import { requireTeamMember } from "../lib/teamAuth";
import { broadcast } from "../lib/teamChatHub";

const router: IRouter = Router();
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) { cb(null, uploadsDir); },
    filename(_req, file, cb) {
      const ext = file.mimetype === "image/png"
        ? ".png"
        : file.mimetype === "image/jpeg"
          ? ".jpg"
          : file.mimetype === "image/gif"
            ? ".gif"
            : ".webp";
      cb(null, `${newId("tu")}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("invalid_file"));
  },
});

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

  const kind = req.body?.kind === "image" ? "image" : "text";
  const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : "";
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (kind === "text") {
    if (!text) { res.status(400).json({ error: "Empty message" }); return; }
    if (text.length > 1000) { res.status(400).json({ error: "Message too long" }); return; }
  } else {
    if (!imageUrl) { res.status(400).json({ error: "Empty imageUrl" }); return; }
    if (imageUrl.length > 2048) { res.status(400).json({ error: "ImageUrl too long" }); return; }
  }

  const [row] = await db.insert(teamMessagesTable).values({
    id: newId("tm"),
    teamId,
    userId: me.id,
    kind,
    text: kind === "text" ? text : "",
    imageUrl: kind === "image" ? imageUrl : null,
  }).returning();

  broadcast(teamId, JSON.stringify({ type: "message", payload: row }));
  res.status(201).json(row);
});

router.post("/teams/:teamId/chat/uploads", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const teamId = String(req.params.teamId);
  const ok = await requireTeamMember(teamId, me.id);
  if (!ok) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    await new Promise<void>((resolve, reject) => {
      upload.single("file")(req as any, res as any, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (e: any) {
    res.status(400).json({ error: "Upload failed" });
    return;
  }

  const file = (req as any).file as { filename: string } | undefined;
  if (!file?.filename) { res.status(400).json({ error: "Missing file" }); return; }
  res.json({ url: `/uploads/${file.filename}` });
});

export default router;
