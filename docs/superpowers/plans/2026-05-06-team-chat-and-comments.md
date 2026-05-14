# TEAMSPIRIT：球隊聊天室（WebSocket）＋活動/公開場留言（Comment）實作計畫

日期：2026-05-06  
依據規格：[2026-05-06-team-chat-and-comments-design.md](file:///workspace/docs/superpowers/specs/2026-05-06-team-chat-and-comments-design.md)

## 1. 交付範圍（MVP）

### 1.1 公開場留言（Public Match Comments）
- 沿用既有 `match_comments`（DB + API 已存在），補齊前端留言輸入與送出體驗。
- 前後端雙重驗證：trim 後不可為空、需限制長度（本計畫採 `max=1000` 字元）。

### 1.2 球隊活動留言（Team Event Comments）
- 新增 `event_comments` 表（避免改動既有 entityType）。
- 新增 API：
  - `GET /api/events/:id/comments`
  - `POST /api/events/:id/comments`
- 前端在活動詳情頁顯示留言 list + 輸入框。

### 1.3 球隊聊天室（Team Chat）
- 新增 `team_messages` 表（可回溯歷史）。
- 新增 HTTP：
  - `GET /api/teams/:teamId/chat/messages?cursor=<optional>&limit=<optional>`
  - `POST /api/teams/:teamId/chat/messages`
- 新增 WebSocket：
  - endpoint：`/ws`
  - client 連線後第一個 payload：`{"type":"join","teamId":"t1"}`
  - server 廣播：`{"type":"message","payload": TeamMessage}`
- 前端新增入口頁：`/teams/:id/chat`，具備：
  - 初次進入 HTTP 拉最近 N 條訊息（本計畫採 `limit=50`）
  - WS join team room
  - 收到 WS 訊息 append；底部時 auto-scroll
  - 發送走 HTTP POST；成功後等待 WS echo 廣播（避免重複 append）
  - 斷線顯示離線提示並自動重連（指數退避）

## 2. 程式碼現況（關聯點）

### 2.1 DB（Drizzle / libsql sqlite）
- DB 入口：[lib/db/src/index.ts](file:///workspace/lib/db/src/index.ts)
- `match_comments`：已存在於 [publicMatches.ts](file:///workspace/lib/db/src/schema/publicMatches.ts)
- `events` / `teams` / `team_members`：  
  - [events.ts](file:///workspace/lib/db/src/schema/events.ts)  
  - [teams.ts](file:///workspace/lib/db/src/schema/teams.ts)

### 2.2 API（Express 5）
- Router 集合：[routes/index.ts](file:///workspace/artifacts/api-server/src/routes/index.ts)
- 公開場留言 API：`POST /public-matches/:id/comments` 於 [publicMatches.ts](file:///workspace/artifacts/api-server/src/routes/publicMatches.ts#L298-L315)
- Auth：`/auth/verify-otp` 設 cookie session 於 [auth.ts](file:///workspace/artifacts/api-server/src/routes/auth.ts#L118-L165)
- Server 目前以 `app.listen` 啟動：[index.ts](file:///workspace/artifacts/api-server/src/index.ts)（要支援 WS，需改為 `http.createServer(app)`）

### 2.3 前端（Vite + React Query + Wouter）
- 公開場詳情頁已有留言列表但缺輸入框：[public-match-detail.tsx](file:///workspace/artifacts/teamspirit/src/pages/public-match-detail.tsx#L280-L308)
- 送出留言動作已在 store 存在：`addMatchComment` 於 [store.tsx](file:///workspace/artifacts/teamspirit/src/lib/store.tsx#L295-L298)
- Vite dev proxy 目前只代理 `/api`： [vite.config.ts](file:///workspace/artifacts/teamspirit/vite.config.ts#L49-L63)（WS 需加 `/ws`）

## 3. 資料模型（DB Schema）變更

### 3.1 新增：event_comments

**新增檔案**
- `lib/db/src/schema/eventComments.ts`

**表結構（sqlite）**
- table：`event_comments`
- 欄位：
  - `id` (text, PK)
  - `eventId` (text, not null)
  - `userId` (text, not null)
  - `text` (text, not null)
  - `createdAt` (text, not null, default `new Date().toISOString()`)

**同步匯出**
- 修改 `lib/db/src/schema/index.ts`，新增：
  - `export * from "./eventComments";`

### 3.2 新增：team_messages

**新增檔案**
- `lib/db/src/schema/teamMessages.ts`

**表結構（sqlite）**
- table：`team_messages`
- 欄位：
  - `id` (text, PK)
  - `teamId` (text, not null)
  - `userId` (text, not null)
  - `text` (text, not null)
  - `createdAt` (text, not null, default `new Date().toISOString()`)

**同步匯出**
- 修改 `lib/db/src/schema/index.ts`，新增：
  - `export * from "./teamMessages";`

### 3.3 開發環境推 schema

**指令**
- `pnpm --filter @workspace/db run push`

> 備註：此 repo 以 `sqlite.db` 作為 workspace 共用資料庫檔（見 [lib/db/src/index.ts](file:///workspace/lib/db/src/index.ts)），`push` 會直接更新本機 schema。

## 4. 後端（API Server）實作步驟

### 4.1 建立共用的 team member 權限檢查（HTTP + WS 共用）

**新增檔案**
- `artifacts/api-server/src/lib/teamAuth.ts`

**內容（決策）**
- 輸出 `requireTeamMember(teamId: string, userId: string): Promise<boolean>`
  - 查 `teamMembersTable` 是否存在 `(teamId, userId)`
- 若後續需要 role 控制，可再擴充為 `requireTeamRole`（目前 MVP 只需 member）

### 4.2 球隊聊天室：HTTP endpoints

**新增檔案**
- `artifacts/api-server/src/routes/teamChat.ts`

**需修改檔案**
- `artifacts/api-server/src/routes/index.ts`：`router.use(teamChatRouter)`

**GET /api/teams/:teamId/chat/messages**
- Query：
  - `limit`：預設 `50`，上限固定 `100`
  - `cursor`：採用「message id」做分頁 cursor
- 行為：
  - `requireAuth`
  - 以 `requireTeamMember(teamId, me.id)` 驗證 membership，不通過回 `403 { error: "Forbidden" }`
  - 先查詢 `cursor` 對應 message（同 team）以取得 `createdAt`（若 cursor 無效，回 `400`）
  - 以 `(createdAt, id)` 做穩定排序：
    - 查詢條件：`createdAt < cursorCreatedAt OR (createdAt = cursorCreatedAt AND id < cursorId)`
    - `orderBy(createdAt desc, id desc)` 拉取 `limit` 筆後再 `reverse()`，回傳時間正序

**POST /api/teams/:teamId/chat/messages**
- Body：`{ text: string }`
- 行為：
  - `requireAuth`
  - membership：同上，不通過回 `403`
  - 驗證：
    - `text` 必須為 string
    - `trim()` 後不可為空（空回 `400 { error: "Empty message" }`）
    - 長度限制：`<= 1000`（超過回 `400 { error: "Message too long" }`）
  - 寫入：
    - `id = newId("tm")`
    - `createdAt` 由 DB default 或 server 明確填入皆可（建議沿用 DB default，回傳時仍可依 `returning()` 取得）
  - 成功後：
    - 回 `201` + message row
    - 呼叫 WS hub 廣播 `{"type":"message","payload": TeamMessage}`

### 4.3 球隊聊天室：WebSocket 伺服器（/ws）

#### 4.3.1 套件與啟動方式調整

**需修改檔案**
- `artifacts/api-server/package.json`
  - dependencies 新增：`ws`
  - devDependencies 新增：`@types/ws`

**新增檔案**
- `artifacts/api-server/src/server.ts`
  - 輸出 `createServer()`：回傳 `{ server, start, stop }`（供 index.ts 與測試共用）
  - `server` 使用 `http.createServer(app)`
  - 在 `server.on("upgrade", ...)` 處理 `/ws` upgrade

**需修改檔案**
- `artifacts/api-server/src/index.ts`
  - 改為呼叫 `createServer().start(port)`
  - 不再直接 `app.listen`

#### 4.3.2 WS room 與廣播（in-memory）

**新增檔案**
- `artifacts/api-server/src/lib/teamChatHub.ts`

**內容（決策）**
- 維護：
  - `connectionsByTeamId: Map<string, Set<WebSocket>>`
  - `teamIdBySocket: WeakMap<WebSocket, string>`
- API：
  - `joinTeam(teamId, ws)`：將 ws 加入該 team set；若 ws 曾加入其他 team，先移除
  - `leave(ws)`：從其 team set 移除
  - `broadcast(teamId, data)`：對該 team set 全部送出（忽略已關閉 socket）

> MVP 採 in-memory room；若未來要多 instance，需升級為 Redis pub/sub 或 message broker（不在本計畫範圍）。

#### 4.3.3 WS auth 與 join 協議

**需修改檔案**
- `artifacts/api-server/src/lib/auth.ts`
  - 新增匯出：`getUserIdFromCookieHeader(cookieHeader: string | undefined): string | null`
  - 其內部使用現有 `verify()` 邏輯（把 `verify` 抽成可共用，仍不需對外暴露 SECRET）

**WS 行為**
- 連線 upgrade 時：
  - 從 `req.headers.cookie` 取 `ts_session`
  - 透過 `getUserIdFromCookieHeader` 取得 userId
  - 無 userId：直接 close（建議 code 4401）
- message 協議：
  - 只接受 JSON object
  - `type === "join"` 時：
    - 需要 `teamId`（string）
    - 驗證 team membership（使用 `requireTeamMember`）
    - 成功：
      - `hub.joinTeam(teamId, ws)`
      - 回覆 `{"type":"joined","teamId":"t1"}`
    - 失敗：
      - 回覆 `{"type":"error","message":"forbidden"}`
- keepalive：
  - server 端每 30s 對所有連線 `ping`，client 無需特別處理（`ws` 會自動 `pong`）
  - 若連線無回應，close 並從 hub 移除

### 4.4 球隊活動留言：API endpoints

**方案**
- 直接掛在既有 events router（避免 router 太散），於：
  - `artifacts/api-server/src/routes/events.ts`

**新增 endpoint：GET /api/events/:id/comments**
- 行為：
  - 先查 event 是否存在（`eventsTable`），不存在回 `404`
  - `requireAuth`
  - 驗證 user 必須為該 event.teamId 的 team member（`teamMembersTable`），否則 `403`
  - 查 `eventCommentsTable`：`where(eventId=id) orderBy(createdAt asc)`
  - 回 `200` + list

**新增 endpoint：POST /api/events/:id/comments**
- Body：`{ text: string }`
- 行為：
  - 同上：event 存在、requireAuth、team member 檢查
  - 驗證 text：
    - trim 後非空（`400 { error: "Empty comment" }`）
    - 長度 `<= 1000`（`400 { error: "Comment too long" }`）
  - insert：
    - `id = newId("ec")`
  - 回 `201` + row

### 4.5 公開場留言：補齊後端長度限制

**需修改檔案**
- `artifacts/api-server/src/routes/publicMatches.ts`

**調整點**
- `POST /public-matches/:id/comments` 現已檢查 empty；加上：
  - `text.length <= 1000`，超過回 `400 { error: "Comment too long" }`

### 4.6 Seed 更新（確保 demo 可用）

**需修改檔案**
- `scripts/src/seed.ts`

**調整點（順序與現有 wipe 模式一致）**
- `import` 新表：
  - `eventCommentsTable`
  - `teamMessagesTable`
- wipe 時新增：
  - `await db.delete(teamMessagesTable);`
  - `await db.delete(eventCommentsTable);`
- seed demo 資料（具體建議）
  - `team_messages`：為 `t1` 插入 3 則訊息（u1/u2/u3 各 1）
  - `event_comments`：挑 1 個 `eventsTable` 內的 event（seed 會建立 events），插入 2 則留言

## 5. 前端（TEAMSPIRIT artifact）實作步驟

### 5.1 型別擴充

**需修改檔案**
- `artifacts/teamspirit/src/lib/types.ts`

**新增型別（與後端欄位對齊）**
- `export interface EventComment { id: string; eventId: string; userId: string; text: string; createdAt: string }`
- `export interface TeamMessage { id: string; teamId: string; userId: string; text: string; createdAt: string }`

### 5.2 公開場留言：補齊輸入框與送出

**需修改檔案**
- `artifacts/teamspirit/src/pages/public-match-detail.tsx`

**UI/互動決策**
- 在現有「留言區」卡片下方新增：
  - `Textarea`（優先使用現成 UI：`@/components/ui/textarea`）
  - `Button`（送出）
- 行為：
  - `Enter` 送出（`Shift+Enter` 換行）
  - 送出期間 disable
  - 成功後清空輸入，並呼叫 `addMatchComment(match.id, text)`
  - 失敗顯示 `toast.error(e.message ?? "送出失敗")`
- 前端驗證：
  - `trim()` 後非空
  - 長度 `<= 1000`（超過直接 toast 提示並阻止送出）

### 5.3 球隊活動留言：EventDetail 加入留言區

**需修改檔案**
- `artifacts/teamspirit/src/pages/event-detail.tsx`

**做法（不改 store，頁面內自帶 query/mutation）**
- 新增 React Query：
  - `useQuery({ queryKey: ["eventComments", event.id], queryFn: () => api<EventComment[]>(\`/events/${event.id}/comments\`) })`
  - 啟用條件：`enabled: !!event?.id`
- 新增送出：
  - `POST /events/:id/comments`
  - 成功後 `qc.invalidateQueries({ queryKey: ["eventComments", event.id] })`
- UI/互動決策
  - 留言區版面沿用公開場樣式（Avatar + 名字 + 日期 + 文本）
  - 輸入框：Enter 送出 / Shift+Enter 換行
  - 顯示 403 時，顯示「你唔係球隊成員」與返回按鈕（同聊天室錯誤訊息一致）

### 5.4 球隊聊天室頁：新增 /teams/:id/chat

**新增檔案**
- `artifacts/teamspirit/src/pages/team-chat.tsx`

**新增檔案**
- `artifacts/teamspirit/src/lib/useTeamChatSocket.ts`

**需修改檔案**
- `artifacts/teamspirit/src/App.tsx`
  - 新增 route：`<Route path="/teams/:teamId/chat" component={TeamChat} />`
- `artifacts/teamspirit/src/pages/team-detail.tsx`
  - 在 team header/action 區新增「聊天室」入口 button/link，導到 `/teams/${team.id}/chat`
- `artifacts/teamspirit/vite.config.ts`
  - `server.proxy` 新增 `/ws`，並啟用 websocket proxy：
    - `"/ws": { target: "http://127.0.0.1:3000", changeOrigin: true, ws: true }`

**TeamChat UI/互動決策**
- 初次載入：
  - `GET /teams/:teamId/chat/messages?limit=50`
  - render 時間正序，並 `scrollToBottom()`
- WS：
  - `new WebSocket(\`\${location.origin.replace(/^http/, "ws")}/ws\`)`
  - `onopen` 立即 `send({ type: "join", teamId })`
  - `onmessage`：
    - `type === "message"`：append `payload`
    - `type === "error"`：顯示錯誤（forbidden）
  - 斷線重連：
    - backoff：`1s → 2s → 4s → 8s → 16s`（上限 16s）
    - 顯示狀態列：「已離線，重連中…」
- 發送：
  - `POST /teams/:teamId/chat/messages`（body `{ text }`）
  - 成功後清空輸入，等待 WS 廣播進來再 append（避免重複）
  - 失敗 toast + 保留輸入文字
- Auto-scroll：
  - 僅在使用者在底部附近（例如距離底部 < 120px）時才 auto-scroll
  - 若使用者正在上滑看歷史，保留 scroll position 並顯示「新訊息」提示按鈕（MVP 可先不做提示按鈕；但需避免強制拉到底）

## 6. 測試計畫（含具體檔案與指令）

> 本 repo 目前未導入 Jest/Vitest；本計畫採 Node 內建 `node:test` 進行後端整合測試，並以既有 dev server + 手動驗收覆蓋前端。

### 6.1 後端整合測試（node:test）

#### 6.1.1 新增測試檔案
- `artifacts/api-server/test/team-chat.test.mjs`
- `artifacts/api-server/test/event-comments.test.mjs`
- `artifacts/api-server/test/match-comments-validation.test.mjs`

#### 6.1.2 測試準備（共用 helper）

**新增檔案**
- `artifacts/api-server/test/helpers.mjs`

**helpers.mjs 需包含**
- `startTestServer()`：
  - import `createServer` from `../src/server.ts`（因此 server.ts 必須 export 可供測試 import）
  - 以 `server.listen(0)` 開 random port，回傳 `{ baseUrl, close }`
- `loginAndGetCookie(baseUrl)`：
  - `POST ${baseUrl}/api/auth/verify-otp`，body `{ phone:"+85291110001", code:"123456", name:"Test" }`
  - 取 `set-cookie` 回傳，解析出 `ts_session=...`，回傳 cookie header 字串（`"ts_session=...;"`）
- `fetchWithCookie(baseUrl, cookie, path, init)`：
  - 自動帶 `Cookie` header

#### 6.1.3 team-chat.test.mjs（驗收規格 #1/#2/#3）

**測項**
1. 兩個 WS client 加入同一 team room，A 發送訊息，B 1 秒內收到
2. 刷新（重查 GET）可見歷史訊息（DB persistence）
3. 非隊員 join 時收到 forbidden（WS error / HTTP 403）

**實作步驟（測試內）**
- `startTestServer()` → `baseUrl`
- `loginAndGetCookie()` 取得 cookie（u1，seed 內 u1 為 t1 member）
- 以 `ws` client 建立兩條連線（同 cookie）：
  - `new WebSocket(`${wsBase}/ws`, { headers: { Cookie: cookie } })`
  - `open` 後各自 send join payload
- 透過 HTTP `POST /api/teams/t1/chat/messages` 發送 `"hello"`
- 斷言：
  - 兩個 WS 皆收到 `type:"message"` 且 `payload.text==="hello"`
  - `payload.teamId==="t1"`、`payload.userId==="u1"`
- 再打 `GET /api/teams/t1/chat/messages?limit=10`，斷言包含該 message id
- 非隊員 case：
  - 另行 `verify-otp` 建立新 user（非 t1 member）
  - HTTP POST 應回 403
  - WS join 應回 error message forbidden

#### 6.1.4 event-comments.test.mjs

**測項**
- team member 可新增並讀取活動留言
- 非 team member 對該 event 回 403

**實作步驟**
- `GET /api/events` 取出一個 `teamId==="t1"` 的 event（seed 必須確保至少一個 t1 event）
- 以 u1 cookie：
  - `POST /api/events/:id/comments` text `"event hello"`
  - `GET /api/events/:id/comments` 斷言包含 `"event hello"`
- 以非 member cookie：
  - `POST` 應回 403

#### 6.1.5 match-comments-validation.test.mjs

**測項**
- 空字串回 400（已存在）
- 超過 1000 字回 400（新增）

**實作步驟**
- 建立一個 public match（可用現有 endpoint `POST /api/public-matches`）
- 對該 match：
  - `POST /api/public-matches/:id/comments` text `" "` → 400
  - `POST ...` text `"a".repeat(1001)` → 400

#### 6.1.6 測試執行指令
- 先 seed：
  - `pnpm --filter @workspace/scripts run seed`
- 啟動測試（node 內建 test runner）：
  - `node --test artifacts/api-server/test/*.test.mjs`

### 6.2 前端手動驗收（對齊規格的可重現步驟）

#### 6.2.1 啟動指令
- `pnpm --filter @workspace/api-server run dev`
- `pnpm --filter @workspace/teamspirit run dev`
- seed（如需重置 demo data）：`pnpm --filter @workspace/scripts run seed`

#### 6.2.2 公開場留言
- 登入任一 demo 用戶（u1/u2/u3）
- 進入任一公開場詳情（/discover/:matchId）
- 於留言輸入框輸入文字並 Enter 送出
- 送出後留言立即出現；刷新頁面仍存在

#### 6.2.3 球隊活動留言
- 進入任一球隊活動詳情（/events/:eventId）
- 留言送出成功並立即出現；刷新頁面仍存在
- 使用非該隊成員帳號嘗試送出，應顯示 forbidden

#### 6.2.4 球隊聊天室
- 兩個不同瀏覽器/無痕視窗分別登入 u1 與 u2（兩者皆為 t1 成員）
- 進入 `/teams/t1/chat`
- A 發送訊息，B 1 秒內收到
- 關閉網路或停掉後端後，頁面顯示「已離線，重連中…」，恢復後可自動重連並繼續收訊息

## 7. 必跑指令（合併前）

- 全 workspace typecheck：
  - `pnpm run typecheck`
- Build（確保 esbuild/vite 編譯過）：
  - `pnpm run build`
- DB schema push（開發環境）：
  - `pnpm --filter @workspace/db run push`

## 8. 逐步落地順序（建議）

1. DB：先加 `event_comments` / `team_messages` schema + `push`（確保 seed/測試可跑）
2. 後端：先完成 HTTP endpoints（方便前端先接線），再補 WS server/hub
3. 前端：先補公開場留言輸入（可快速驗收），再做 event comments，最後做 team chat 頁
4. 測試：完成 `server.ts` 可測試化後，寫 node:test 整合測試並納入 CI（至少在本地跑過）

