import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { OAuth2Client } from "google-auth-library";
import {
  setSessionCookie,
  clearSessionCookie,
  getUserIdFromReq,
} from "../lib/auth";
import { newId } from "../lib/ids";

const router: IRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "123456789-dummy-client-id.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const GoogleAuthBody = z.object({ credential: z.string() });

router.post("/auth/google", async (req, res): Promise<void> => {
  const parsed = GoogleAuthBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid credential" }); return; }

  try {
    const base64Url = parsed.data.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64));
    const payload = JSON.parse(jsonPayload);

    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token payload" });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || `球員${email.split('@')[0]}`;
    const picture = payload.picture || `https://i.pravatar.cc/150?u=${googleId}`;

    let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId));
    
    if (!user) {
      let [existingEmailUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
      
      if (existingEmailUser) {
        [user] = await db.update(usersTable)
          .set({ googleId, avatarUrl: picture })
          .where(eq(usersTable.id, existingEmailUser.id))
          .returning();
      } else {
        const id = newId("u");
        [user] = await db.insert(usersTable).values({
          id, googleId, email, name, avatarUrl: picture,
          tokensBalance: 0, subscription: "free",
          seasonStatsByTeam: {},
        }).returning();
      }
    }

    setSessionCookie(res, user.id);
    res.json({ user });
  } catch (error) {
    req.log.error({ error }, "Google auth failed");
    res.status(401).json({ error: "Google 登入失敗" });
  }
});

router.post("/auth/demo", async (req, res): Promise<void> => {
  const email = "player1@example.com";
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  
  if (!user) {
    const id = newId("u");
    [user] = await db.insert(usersTable).values({
      id,
      googleId: "demo-google-id",
      email,
      name: "Demo Player",
      avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
      tokensBalance: 40,
      subscription: "pro",
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