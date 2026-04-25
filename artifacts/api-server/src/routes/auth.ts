import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  setSessionCookie,
  clearSessionCookie,
  getUserIdFromReq,
} from "../lib/auth";
import { newId } from "../lib/ids";
import { OAuth2Client } from "google-auth-library";

const router: IRouter = Router();

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const GoogleAuthBody = z.object({ credential: z.string() });

router.post("/auth/google", async (req, res): Promise<void> => {
  const parsed = GoogleAuthBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token payload" });
      return;
    }

    const email = payload.email;
    const googleId = payload.sub;
    const name = payload.name || "球員";
    const picture = payload.picture || "";

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (!user) {
      const id = newId("u");
      [user] = await db.insert(usersTable).values({
        id, email, googleId, name,
        avatarUrl: picture || `https://i.pravatar.cc/150?u=${id}`,
        tokensBalance: 0, subscription: "free",
        seasonStatsByTeam: {},
      }).returning();
    } else if (!user.googleId) {
      [user] = await db.update(usersTable)
        .set({ googleId })
        .where(eq(usersTable.id, user.id))
        .returning();
    }

    setSessionCookie(res, user.id);
    res.json({ user });
  } catch (error) {
    req.log.error(error, "Google auth failed");
    res.status(401).json({ error: "Google 登入失敗" });
  }
});

router.post("/auth/demo", async (req, res): Promise<void> => {
  const email = "ahfai@example.com"; // Use existing seed user
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    const id = newId("u");
    [user] = await db.insert(usersTable).values({
      id, email, name: "Ah Fai",
      avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
      tokensBalance: 40, subscription: "pro",
      seasonStatsByTeam: {},
    }).returning();
  }
  setSessionCookie(res, user.id);
  res.json({ user });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = getUserIdFromReq(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!u) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json({ user: u });
});

export default router;
