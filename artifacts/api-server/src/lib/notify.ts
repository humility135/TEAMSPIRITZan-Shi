import { db, notificationsTable } from "@workspace/db";
import { newId } from "./ids";

export async function notify(userId: string, message: string, type: "event" | "system" | "team" = "event") {
  await db.insert(notificationsTable).values({
    id: newId("n"),
    userId,
    type,
    message,
    read: false,
  });
}

export async function notifyMany(userIds: string[], message: string, type: "event" | "system" | "team" = "event") {
  if (userIds.length === 0) return;
  await db.insert(notificationsTable).values(
    userIds.map((userId) => ({
      id: newId("n"),
      userId,
      type,
      message,
      read: false,
    })),
  );
}
