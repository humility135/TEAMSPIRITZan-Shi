import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, teamsTable, teamMembersTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { newId } from "../lib/ids";

const router: IRouter = Router();

router.get("/teams", async (_req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable);
  const members = await db.select().from(teamMembersTable);
  const memberIdsByTeam: Record<string, string[]> = {};
  for (const m of members) (memberIdsByTeam[m.teamId] ??= []).push(m.userId);
  res.json(teams.map((t) => ({ ...t, memberIds: memberIdsByTeam[t.id] ?? [] })));
});

router.get("/team-members", async (_req, res): Promise<void> => {
  const rows = await db.select().from(teamMembersTable);
  res.json(rows);
});

const CreateTeamBody = z.object({
  name: z.string().min(1),
  district: z.string().optional(),
  level: z.number().int().min(1).max(5).optional(),
  accentColor: z.string().optional(),
  logoUrl: z.string().optional(),
});

router.post("/teams", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const me = (req as AuthedRequest).user;
  const id = newId("t");
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const [team] = await db.insert(teamsTable).values({
    id,
    name: parsed.data.name,
    logoUrl: parsed.data.logoUrl ?? `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(parsed.data.name)}`,
    accentColor: parsed.data.accentColor ?? "#84cc16",
    district: parsed.data.district,
    level: parsed.data.level,
    inviteCode,
  }).returning();
  await db.insert(teamMembersTable).values({ teamId: id, userId: me.id, role: "Owner" });
  res.status(201).json({ ...team, memberIds: [me.id] });
});

const UpdateTeamBody = z.object({
  name: z.string().optional(),
  logoUrl: z.string().optional(),
  accentColor: z.string().optional(),
  district: z.string().optional(),
  level: z.number().int().min(1).max(5).optional(),
});

async function requireTeamRole(teamId: string, userId: string, allowed: Array<"Owner" | "Admin" | "Member">): Promise<boolean> {
  const [m] = await db.select().from(teamMembersTable)
    .where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)));
  return !!m && allowed.includes(m.role as any);
}

router.patch("/teams/:teamId", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const me = (req as AuthedRequest).user;
  const teamId = String(req.params.teamId);
  if (!(await requireTeamRole(teamId, me.id, ["Owner", "Admin"]))) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const [updated] = await db.update(teamsTable).set(parsed.data).where(eq(teamsTable.id, teamId)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.post("/teams/:teamId/leave", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const teamId = String(req.params.teamId);
  await db.delete(teamMembersTable).where(
    and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, me.id)),
  );
  res.json({ ok: true });
});

router.delete("/teams/:teamId/members/:userId", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const teamId = String(req.params.teamId);
  const userId = String(req.params.userId);
  if (!(await requireTeamRole(teamId, me.id, ["Owner", "Admin"]))) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.delete(teamMembersTable).where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)));
  res.json({ ok: true });
});

const SetRoleBody = z.object({ role: z.enum(["Owner", "Admin", "Member"]) });

router.patch("/teams/:teamId/members/:userId", requireAuth, async (req, res): Promise<void> => {
  const parsed = SetRoleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const me = (req as AuthedRequest).user;
  const teamId = String(req.params.teamId);
  const userId = String(req.params.userId);
  if (!(await requireTeamRole(teamId, me.id, ["Owner", "Admin"]))) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const [updated] = await db.update(teamMembersTable)
    .set({ role: parsed.data.role })
    .where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)))
    .returning();
  res.json(updated ?? { ok: true });
});

export default router;
