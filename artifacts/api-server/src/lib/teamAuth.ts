import { and, eq } from "drizzle-orm";
import { db, teamMembersTable } from "@workspace/db";

export async function requireTeamMember(teamId: string, userId: string): Promise<boolean> {
  const [row] = await db.select().from(teamMembersTable)
    .where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)));
  return !!row;
}
