# TEAMSPIRIT：球隊聊天室（WebSocket）＋活動/公開場留言（Comment）設計稿

日期：2026-05-06  
範圍：`artifacts/teamspirit`（前端）＋ `artifacts/api-server`（後端）＋ `lib/db`（schema）

## 目標

1. 活動/公開場底下使用留言（Comment）形式溝通（非聊天室）。
2. 每個球隊有一個專屬「即時群組聊天室」：純文字訊息流、可發送、真即時（WebSocket），入口為獨立頁 `/teams/:id/chat`。
3. MVP 第一版先做到「基本訊息」：訊息流 + 發送 + 即時收取；暫不做 `@` 提醒與已讀未讀。

## 非目標（MVP 不做）

1. `@` 提醒、已讀未讀（read receipt / last-read marker）。
2. 圖片/檔案/語音。
3. 訊息刪除、編輯、pin、搜尋。
4. 全局聊天室列表/多房間（只做每隊 1 個 room）。

## 現況盤點（可重用能力）

1. 公開場留言 `match_comments` 已存在（DB + API + 前端 store 有拉取資料）
   - DB：`match_comments`（`matchId/userId/text/createdAt`）
   - API：`POST /public-matches/:id/comments`
   - 前端：`matchComments` 已全量拉取並可 filter 顯示
2. 通知系統已存在（可日後用於 `@` 或新訊息提醒）
   - 後端工具：`notify/notifyMany`
   - 前端 UI：Layout notification dropdown + 未讀數

## 設計總覽

### A) 活動/公開場留言（Comment）

#### 公開場（Public Match）
- 沿用既有 `match_comments`，補齊：
  - 留言輸入框（textarea / input）
  - 送出按鈕（Enter 送出；Shift+Enter 換行可選）
  - 送出後即刻 append / 或 invalidate query 重新拉取
  - 空字串、過長字串擋掉（前後端雙保險）

#### 球隊活動（Team Event）
- 需要新增 event 專用留言（可沿用 match comment 模式）
- 方案（MVP 建議用獨立表，避免 entityType 改動過大）：
  - DB：`event_comments`（`eventId/userId/text/createdAt`）
  - API：`GET /events/:id/comments`、`POST /events/:id/comments`
  - 前端：event-detail 顯示 + 輸入框

### B) 球隊聊天室（Team Chat，WebSocket 真即時）

#### 使用情境
- 同一隊球員長期溝通：集合時間、缺人補位、裝備提醒等。
- 資料要求：可回溯（至少拉最近 N 條）、可靠寫入（斷線仍可重試）。

#### 技術方案（採用方案 A：WebSocket + HTTP fallback）

**HTTP（可靠寫入 / 初始載入 / 分頁）**
- `GET /teams/:teamId/chat/messages?cursor=<optional>&limit=<optional>`
  - 回傳時間倒序或正序（建議正序，方便 UI render）
  - `cursor` 用 message id 或 createdAt
- `POST /teams/:teamId/chat/messages`
  - body：`{ text: string }`
  - server 驗證：必須 team member、trim、長度限制
  - 成功：寫入 DB，並向 WS room 廣播新訊息

**WebSocket（即時收取 / 廣播）**
- endpoint：`/ws`
- client 連線後第一個 payload：
  - `{"type":"join","teamId":"t1"}`
- server 廣播：
  - `{"type":"message","payload": TeamMessage }`
- MVP 僅支援：
  - join room
  - receive message
  - （可選）ping/pong keepalive

#### 權限與安全
- HTTP：沿用現有 cookie session（`requireAuth`），再檢查 user 是否屬於該 team（teamMembersTable / team.memberIds）。
- WS：
  - 連線時讀 cookie session → identify user
  - join 時驗證 team membership，否則回 `{"type":"error","message":"forbidden"}`
- 不記錄或回傳敏感資料（只回 message 基本欄位）。

#### 資料模型（DB）

新增表：`team_messages`
- `id`：string
- `teamId`：string
- `userId`：string
- `text`：string
- `createdAt`：ISO string

前端型別：`TeamMessage`
- `id, teamId, userId, text, createdAt`

#### 前端 UI：`/teams/:id/chat`
- 版面：
  - Header：球隊名 + 返回
  - Body：訊息 list（由舊到新，scroll to bottom）
  - Footer：輸入框 + 發送按鈕（Enter 送出）
- 行為：
  - 初次進入：HTTP 拉最近 N 條
  - 建立 WS：join team room
  - 收到 WS 訊息：append 到 list；如果 user 正在底部就 auto-scroll
  - 發送：先 disable，POST 成功後由 WS echo/廣播追加（避免重複）

## 錯誤處理

1. WS 斷線：顯示「已離線，重連中…」，自動重連（指數退避）。
2. POST 發送失敗：提示 toast，保留輸入文字可重試。
3. 非 team member：顯示「你唔係球隊成員」，並提供返回。

## 測試與驗收標準（MVP）

1. 兩個不同用戶打開同一隊 `/teams/:id/chat`：
   - A 發送訊息，B 可以即時收到（1 秒內）
2. 刷新頁面後仍見到歷史訊息（DB persistence）
3. 非隊員無法進入聊天室 / 發送訊息（403/forbidden）
4. 公開場留言支援新增留言並即時出現（同頁更新即可，不要求 WS）

## 後續迭代（下一版）

1. `@` 提醒：解析 `@name` → `notifyMany` 該 team member
2. 已讀未讀：每人每 team 記 `lastReadAt/lastReadMessageId`，並在 UI 做 unread divider
3. Push notification / badge 整合

