# 球隊 Chatroom：全站入口 + 新訊息通知（設計稿）

## 背景

目前每個球隊已有獨立聊天室路由：`/teams/:teamId/chat`（前端：[team-chat.tsx](file:///workspace/artifacts/teamspirit/src/pages/team-chat.tsx)；後端：[teamChat.ts](file:///workspace/artifacts/api-server/src/routes/teamChat.ts)）。

但用家需要先進入球隊詳情頁先能打開聊天室，入口不夠直接；同時新訊息未與現有通知系統整合，難以「有訊息即知」。

## 目標（Goals）

- 用家在任何頁面都可快速打開 chatroom（全站頂 bar / 側邊欄有 Chat 入口）。
- 每個球隊維持一個獨立 chatroom（`/teams/:teamId/chat`）。
- 新訊息會透過現有鈴鐺通知系統呈現（每條訊息一個通知：B1）。
- Chat 入口列表按「最近活動」排序（A2：最近有訊息/通知的球隊排最上）。
- 通知內容使用「隊名 + 發訊人 + preview」格式（選項 2）。

## 非目標（Non-goals）

- 不做真正 per-message 已讀（read receipt）。
- 不做 per-team unread 的獨立資料表／summary API（先用 notifications 分組計算）。
- 不改現有聊天 API/WS 協議（仍用 `/ws` + `join` + `message`）。
- 不做通知合併（B1 明確每條訊息都出通知）。

## 使用者體驗（UX）

### 1) 全站 Chat 入口（頂 bar / sidebar）

- 新增 Chat icon 按鈕（可使用 `MessageSquare` 或同系列 icon）。
- 點擊後打開 dropdown/menu：
  - 顯示「我嘅球隊」列表
  - 每項顯示：球隊名、最後活動時間（lastActivity）、（可選）未讀數（按該隊未讀通知計）
  - 排序：`lastActivity desc`（A2）
- 點任何球隊 → 導航至 `/teams/:teamId/chat`

### 2) 鈴鐺通知（每條訊息一個通知）

- 當隊員在球隊 chatroom 發送訊息（文字或圖片）：
  - 其他成員會收到鈴鐺未讀通知
  - 點通知可直接跳入對應球隊 chatroom（並 mark read）

通知文案（選項 2）：
- 文字訊息：`{teamName}: {senderName}: {preview}`
- 圖片訊息：`{teamName}: {senderName}: sent an image` / `發送咗一張圖片`

## 資料與 DB 變更

### notifications schema 擴充

現有 notifications schema 位於：
- DB schema：[notifications.ts](file:///workspace/lib/db/src/schema/notifications.ts)
- API routes：[notifications.ts](file:///workspace/artifacts/api-server/src/routes/notifications.ts)

新增欄位（建議）：
- `href?: string`（可選）
  - 用於前端「一按跳轉」到 chatroom
  - 範例：`/teams/t_xxx/chat`

### 兼容性

- 舊通知沒有 `href` 時維持原行為（只標記已讀）。
- `href` 不影響現有 notifications UI（只做條件性跳轉）。

## 後端設計（API / 行為）

### Team chat 發送訊息時寫入 notifications（type=team）

後端現況：
- chat 寫入訊息：`POST /teams/:teamId/chat/messages`（[teamChat.ts](file:///workspace/artifacts/api-server/src/routes/teamChat.ts#L73-L102)）
- 目前只會 `broadcast(teamId, ...)`，不會寫 notifications。
- notifications helper：[notify.ts](file:///workspace/artifacts/api-server/src/lib/notify.ts)

新增行為（在 chat message insert 成功後）：
- 查詢該 team 的所有成員 userId（`teamMembersTable`）
- 排除 sender 自己
- 對每個收件者寫入一條 notifications：
  - `type = "team"`
  - `message / messageEn`（見文案規則）
  - `href = "/teams/:teamId/chat"`

文案組裝所需資料：
- teamName：從 teamsTable 取 team.name
- senderName：從 usersTable 取 sender.name
- preview：
  - text：截斷前 N 個字（例如 40 字，避免太長）
  - image：固定字串

### 安全 / 權限

- 維持 requireTeamMember 的現有權限邏輯；非隊員不會觸發通知寫入。
- `href` 只會指向站內路由，不允許外部 URL（避免被濫用作釣魚）。

## 前端設計

### Layout：新增 Chat dropdown

位置：
- 手機頂 bar（[layout.tsx](file:///workspace/artifacts/teamspirit/src/components/layout.tsx#L41-L74)）
- 桌面 sidebar 可加在 navItems 或 notifications 旁

資料來源：
- `teams`（用來列出「我嘅球隊」）
- `notifications`（用來計算 per-team lastActivity/unreadCount）

衍生資料（計算方式）：
- 先從 notifications 篩 `type === "team"` 且 `href` 指向 `/teams/:teamId/chat`
- 解析 teamId（由 href 拆出 teamId）
- per team：
  - `lastActivity = max(createdAt)`
  - `unreadCount = count(!read)`
- 排序：`lastActivity desc`（A2），沒有任何活動的 team 排底

點擊項目：
- 直接 `setLoc(/teams/:teamId/chat)`

### Notifications：點擊可跳轉 chat

目前通知頁只會 mark read（[notifications.tsx](file:///workspace/artifacts/teamspirit/src/pages/notifications.tsx#L65-L91)）。

變更建議：
- 若通知帶 `href`：
  - click 時先 `markNotificationRead(n.id)`
  - 再導航到 `href`

同樣適用於 mobile top bar 的鈴鐺 dropdown item（[layout.tsx](file:///workspace/artifacts/teamspirit/src/components/layout.tsx#L45-L68)）。

## 測試策略

- 後端：
  - team chat message API：驗證對其他成員寫入 notifications（type=team, href 正確，message 格式正確）
- 前端：
  - Layout 的 per-team 排序與 unread 計算（可用 unit test + mock store）
  - Notifications 點擊含 href 的項目會導航到 chat

## 驗收準則（Acceptance Criteria）

- 用家在任何頁面能透過頂 bar/側邊欄 Chat 按鈕打開任一球隊 chatroom。
- A2：有新訊息的球隊會在 Chat menu 自動排到最上。
- B1：每條新訊息都會為「其他成員」生成 1 條未讀通知（鈴鐺未讀數會增加）。
- 通知內容符合選項 2 的格式（隊名 + 發訊人 + preview）。
- 點擊通知可直接跳入該隊 chatroom 並將該通知標記已讀。

