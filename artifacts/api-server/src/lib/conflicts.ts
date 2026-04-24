import { db, eventsTable, publicMatchesTable } from "@workspace/db";
import { gte } from "drizzle-orm";

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export function getEndTime(start: Date, end?: Date | null): Date {
  if (end) return end;
  return new Date(start.getTime() + DEFAULT_DURATION_MS);
}

export function hasTimeConflict(
  start1: Date,
  end1: Date | null | undefined,
  start2: Date,
  end2: Date | null | undefined
): boolean {
  const s1 = start1.getTime();
  const e1 = getEndTime(start1, end1).getTime();
  const s2 = start2.getTime();
  const e2 = getEndTime(start2, end2).getTime();

  return s1 < e2 && e1 > s2;
}

export async function checkUserTimeConflict(userId: string, start: Date, end?: Date | null): Promise<boolean> {
  const upcomingEvents = await db.select().from(eventsTable)
    .where(gte(eventsTable.datetime, new Date())); 

  for (const e of upcomingEvents) {
    if (e.attendingIds.includes(userId)) {
      if (hasTimeConflict(start, end, e.datetime, e.endDatetime)) return true;
    }
  }

  const upcomingMatches = await db.select().from(publicMatchesTable)
    .where(gte(publicMatchesTable.datetime, new Date()));

  for (const m of upcomingMatches) {
    if (m.attendees.includes(userId)) {
      if (hasTimeConflict(start, end, m.datetime, m.endDatetime)) return true;
    }
  }

  return false;
}
