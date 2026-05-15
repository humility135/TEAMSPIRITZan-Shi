# Team Chatroom Entry + Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global Chat entry in the app shell and generate bell notifications for every new team chat message, with notifications deep-linking into the right team chatroom.

**Architecture:** Reuse existing notifications table + polling. Add an optional `href` to notifications for deep-links. On every team chat message, backend writes `type="team"` notifications to other team members. Frontend aggregates team notifications by `teamId` to sort chat menu items by last activity (A2).

**Tech Stack:** React + wouter + TanStack Query (frontend), Express + drizzle-orm + sqlite/libsql (backend), Radix/shadcn dropdowns, vitest (frontend tests).

---

## File Map (What changes where)

**DB**
- Modify: [/workspace/lib/db/src/schema/notifications.ts](file:///workspace/lib/db/src/schema/notifications.ts)

**Backend**
- Modify: [/workspace/artifacts/api-server/src/lib/notify.ts](file:///workspace/artifacts/api-server/src/lib/notify.ts)
- Modify: [/workspace/artifacts/api-server/src/routes/teamChat.ts](file:///workspace/artifacts/api-server/src/routes/teamChat.ts)

**Frontend**
- Modify: [/workspace/artifacts/teamspirit/src/lib/types.ts](file:///workspace/artifacts/teamspirit/src/lib/types.ts)
- Modify: [/workspace/artifacts/teamspirit/src/components/layout.tsx](file:///workspace/artifacts/teamspirit/src/components/layout.tsx)
- Modify: [/workspace/artifacts/teamspirit/src/pages/notifications.tsx](file:///workspace/artifacts/teamspirit/src/pages/notifications.tsx)
- Modify tests: [/workspace/artifacts/teamspirit/src/components/layout.test.tsx](file:///workspace/artifacts/teamspirit/src/components/layout.test.tsx)
- Create tests: `/workspace/artifacts/teamspirit/src/pages/notifications.test.tsx`

---

### Task 1: Add `href` to notifications table (DB)

**Files:**
- Modify: [/workspace/lib/db/src/schema/notifications.ts](file:///workspace/lib/db/src/schema/notifications.ts)

- [ ] **Step 1: Update schema**

```ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notificationsTable = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  messageEn: text("message_en"),
  href: text("href"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
```

- [ ] **Step 2: Push schema**

Run:

```bash
pnpm -C /workspace/lib/db push
```

Expected: drizzle-kit applies an ALTER TABLE (or equivalent) to add `href`.

- [ ] **Step 3: Quick verification**

Run:

```bash
pnpm -C /workspace/lib/db verify:venues
```

Expected: Succeeds (sanity check that DB tooling still works).

---

### Task 2: Extend notify helpers to support `href` without breaking existing calls

**Files:**
- Modify: [/workspace/artifacts/api-server/src/lib/notify.ts](file:///workspace/artifacts/api-server/src/lib/notify.ts)

- [ ] **Step 1: Introduce a backward-compatible 4th parameter**

Target behavior:
- Old calls like `notify(userId, msg, msgEn, "event")` keep working.
- New calls can pass `{ type: "team", href: "/teams/..../chat" }`.

```ts
import { db, notificationsTable } from "@workspace/db";
import { newId } from "./ids";

type NotifyType = "event" | "system" | "team";
type NotifyOpts = { type?: NotifyType; href?: string };

function parseNotifyOpts(typeOrOpts?: NotifyType | NotifyOpts): NotifyOpts {
  if (!typeOrOpts) return {};
  if (typeof typeOrOpts === "string") return { type: typeOrOpts };
  return typeOrOpts;
}

export async function notify(
  userId: string,
  message: string,
  messageEn?: string,
  typeOrOpts?: NotifyType | NotifyOpts,
) {
  const { type = "event", href } = parseNotifyOpts(typeOrOpts);
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
  typeOrOpts?: NotifyType | NotifyOpts,
) {
  if (userIds.length === 0) return;
  const { type = "event", href } = parseNotifyOpts(typeOrOpts);
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
```

- [ ] **Step 2: Typecheck backend**

Run:

```bash
pnpm -C /workspace/artifacts/api-server typecheck
```

Expected: PASS.

---

### Task 3: Write notifications on every team chat message (B1)

**Files:**
- Modify: [/workspace/artifacts/api-server/src/routes/teamChat.ts](file:///workspace/artifacts/api-server/src/routes/teamChat.ts)

- [ ] **Step 1: Import tables + helpers**

Add imports (adjust to actual schema exports from `@workspace/db`):

```ts
import { db, teamMessagesTable, teamMembersTable, teamsTable, usersTable } from "@workspace/db";
import { notifyMany } from "../lib/notify";
```

- [ ] **Step 2: After inserting message, compute recipients**

```ts
const [members] = await Promise.all([
  db.select().from(teamMembersTable).where(eq(teamMembersTable.teamId, teamId)),
]);

const recipientIds = members
  .map((m) => m.userId)
  .filter((uid) => uid !== me.id);
```

- [ ] **Step 3: Build message text (選項 2) + write notifications**

Rules:
- Text: `{teamName}: {senderName}: {preview}` (preview ≤ 40 chars)
- Image: `{teamName}: {senderName}: sent an image` / `發送咗一張圖片`

```ts
const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, me.id));
const teamName = team?.name ?? teamId;
const senderName = sender?.name ?? "Someone";

const preview = kind === "image"
  ? "發送咗一張圖片"
  : text.length > 40 ? `${text.slice(0, 40)}…` : text;
const previewEn = kind === "image"
  ? "sent an image"
  : text.length > 40 ? `${text.slice(0, 40)}…` : text;

await notifyMany(
  recipientIds,
  `${teamName}: ${senderName}: ${preview}`,
  `${teamName}: ${senderName}: ${previewEn}`,
  { type: "team", href: `/teams/${teamId}/chat` },
);
```

- [ ] **Step 4: Manual verification (no backend test runner in repo)**

Run dev server (2 users in 2 browsers / sessions):
- User A sends a message in team chatroom
- User B opens notifications page and sees a new notification with correct preview
- Clicking notification jumps to `/teams/:teamId/chat`

---

### Task 4: Add `href?: string` to frontend Notification type

**Files:**
- Modify: [/workspace/artifacts/teamspirit/src/lib/types.ts](file:///workspace/artifacts/teamspirit/src/lib/types.ts)

- [ ] **Step 1: Update interface**

```ts
export interface Notification {
  id: string;
  type: "event" | "system" | "team";
  message: string;
  messageEn?: string;
  href?: string;
  createdAt: string;
  read: boolean;
}
```

- [ ] **Step 2: Frontend typecheck**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit typecheck
```

Expected: PASS.

---

### Task 5: Add a global Chat dropdown in Layout (A2)

**Files:**
- Modify: [/workspace/artifacts/teamspirit/src/components/layout.tsx](file:///workspace/artifacts/teamspirit/src/components/layout.tsx)
- Test: [/workspace/artifacts/teamspirit/src/components/layout.test.tsx](file:///workspace/artifacts/teamspirit/src/components/layout.test.tsx)

- [ ] **Step 1: Extend store fields used by Layout**

Update store destructure to include `teams` and `currentUser`:

```ts
const { isProMode, toggleProMode, notifications, markNotificationRead, teams, currentUser } = useAppStore();
```

- [ ] **Step 2: Add a Chat trigger button**

Use existing `DropdownMenu` components.
Recommended aria-label: `t('teamDetailChat')`.

- [ ] **Step 3: Derive per-team activity from notifications**

Add a small helper inside Layout:

```ts
const parseTeamIdFromHref = (href?: string) => {
  if (!href) return null;
  const m = href.match(/^\/teams\/([^/]+)\/chat$/);
  return m ? m[1] : null;
};

const myTeams = teams.filter((t) => t.memberIds.includes(currentUser.id));
const teamNotifs = notifications.filter((n) => n.type === "team");

const metaByTeamId = new Map<string, { lastActivity: number; unreadCount: number }>();
for (const n of teamNotifs) {
  const teamId = parseTeamIdFromHref(n.href);
  if (!teamId) continue;
  const t = metaByTeamId.get(teamId) ?? { lastActivity: 0, unreadCount: 0 };
  const ts = new Date(n.createdAt).getTime();
  if (Number.isFinite(ts)) t.lastActivity = Math.max(t.lastActivity, ts);
  if (!n.read) t.unreadCount += 1;
  metaByTeamId.set(teamId, t);
}

const chatTeams = [...myTeams].sort((a, b) => {
  const aMeta = metaByTeamId.get(a.id);
  const bMeta = metaByTeamId.get(b.id);
  const aTs = aMeta?.lastActivity ?? 0;
  const bTs = bMeta?.lastActivity ?? 0;
  if (aTs !== bTs) return bTs - aTs;
  return a.name.localeCompare(b.name);
});
```

- [ ] **Step 4: Render dropdown items**

Each team item:
- label: team.name
- secondary: unreadCount (if > 0)
- onClick: navigate to `/teams/${team.id}/chat`

- [ ] **Step 5: Update existing bell dropdown click behavior**

If notification has `href`, then:
- `markNotificationRead(n.id)`
- navigate to `n.href`

- [ ] **Step 6: Update / fix Layout tests**

Update mock store in [layout.test.tsx](file:///workspace/artifacts/teamspirit/src/components/layout.test.tsx) to include `teams` and `currentUser`.

Add an assertion that a Chat trigger exists:

```ts
expect(getAllByLabelText("聊天室").length).toBeGreaterThan(0);
```

---

### Task 6: Notifications page deep-link to chat

**Files:**
- Modify: [/workspace/artifacts/teamspirit/src/pages/notifications.tsx](file:///workspace/artifacts/teamspirit/src/pages/notifications.tsx)
- Create test: `/workspace/artifacts/teamspirit/src/pages/notifications.test.tsx`

- [ ] **Step 1: Navigate on click when `href` exists**

Add `useLocation` and update card click handler:

```ts
const [, setLoc] = useLocation();

onClick={() => {
  markNotificationRead(n.id);
  if (n.href) setLoc(n.href);
}}
```

- [ ] **Step 2: Add a unit test**

Create `notifications.test.tsx`:
- mock `useLocation` to capture navigation
- render Notifications with one notification containing `href`
- click the notification card
- assert `markNotificationRead` called and `setLoc` called with href

---

### Task 7: Full frontend verification

- [ ] **Step 1: Run typecheck + tests**

```bash
pnpm -C /workspace/artifacts/teamspirit typecheck
pnpm -C /workspace/artifacts/teamspirit test
```

Expected: PASS.

- [ ] **Step 2: Manual UI smoke**
- Confirm top bar/side bar Chat dropdown shows teams and sorts by recent activity (A2).
- Send a team message from User A, confirm User B sees bell notification (B1) with preview.
- Click that notification, confirm it navigates to the correct team chatroom.

