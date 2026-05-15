import { db, notificationsTable } from "@workspace/db";
import { newId } from "./ids";

type NotificationType = "event" | "system" | "team";
type NotifyOptions = { type?: NotificationType; href?: string };

function normalizeNotifyOptions(typeOrOptions?: NotificationType | NotifyOptions): { type: NotificationType; href?: string } {
  if (typeof typeOrOptions === "string") return { type: typeOrOptions };
  return { type: typeOrOptions?.type ?? "event", href: typeOrOptions?.href };
}

export async function notify(
  userId: string,
  message: string,
  messageEn?: string,
  typeOrOptions?: NotificationType | NotifyOptions,
) {
  const { type, href } = normalizeNotifyOptions(typeOrOptions);
  await db.insert(notificationsTable).values({
    id: newId("n"),
    userId,
    type,
    message,
    messageEn,
    href,
    read: false,
  });
}

export async function notifyMany(
  userIds: string[],
  message: string,
  messageEn?: string,
  typeOrOptions?: NotificationType | NotifyOptions,
) {
  if (userIds.length === 0) return;
  const { type, href } = normalizeNotifyOptions(typeOrOptions);
  await db.insert(notificationsTable).values(
    userIds.map((userId) => ({
      id: newId("n"),
      userId,
      type,
      message,
      messageEn,
      href,
      read: false,
    })),
  );
}
