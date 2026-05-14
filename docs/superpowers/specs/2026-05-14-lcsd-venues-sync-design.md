# TEAMSPIRIT：康文署（LCSD）球場資料同步（中英文）設計稿

日期：2026-05-14  
範圍：`lib/db`（同步腳本 + schema）＋ `artifacts/api-server`（讀取）＋ `artifacts/teamspirit`（選擇球場 UI）

## 背景／問題

- 前端「選擇球場」資料來源係 `GET /api/venues`，而 API 直接 `select * from venues` 回傳。
- 目前 `venues` 表有機會變成 0 筆（例如手動清空、或同步流程先清空後 fetch 失敗），導致前端完全無球場可揀。
- 需要一個易用嘅手動同步指令，並改善同步流程，避免再出現「清空咗但冇寫返入去」。

## 目標

1. 提供單一指令，手動匯入 LCSD 球場到 `venues` 表。
2. 同步後 `venues` 每筆都有中英文欄位（可空但盡量填）：
   - 中文：`name / district / address`
   - 英文：`nameEn / districtEn / addressEn`
3. 同步流程要安全：只有成功取得並解析到有效資料先會覆蓋 DB（避免 venues 變 0）。

## 非目標

- 不做排程自動同步。
- 不改前端 venue 顯示邏輯（前端已支援英文介面 fallback：`nameEn || name` 等）。
- 不新增新的 DB 欄位（沿用現有 schema：`name_en/district_en/address_en`）。

## 現況盤點

- 同步腳本位置：[sync-lcsd.ts](file:///workspace/lib/db/scripts/sync-lcsd.ts)
- DB schema（venues）：[venues.ts](file:///workspace/lib/db/src/schema/venues.ts)
- 前端使用（選擇球場）：[venue-selector.tsx](file:///workspace/artifacts/teamspirit/src/components/venue-selector.tsx)
- 英文地區對照（fallback 用）：[districts.ts](file:///workspace/artifacts/teamspirit/src/lib/districts.ts)

## 設計總覽

### A) 加入 `pnpm` 指令

在 `lib/db/package.json` 新增 script：

- `sync:lcsd`：用 `tsx` 直接執行 `lib/db/scripts/sync-lcsd.ts`

目標用法：

```bash
pnpm -C /workspace/lib/db sync:lcsd
```

### B) 同步流程安全化（成功先覆蓋）

同步腳本改為兩段式：

1. **Fetch + Parse 階段（不寫 DB）**
   - 逐個 `LCSD_SOURCES` 下載 JSON
   - 將資料 normalize 成「準備寫入 DB」嘅 array（只留必要欄位）
   - 計數：總筆數必須 > 0（以及每筆需有 `name/lat/lng` 等最基本資料）
2. **Write 階段（一次性覆蓋 DB）**
   - 用 transaction（或同等效果）做：
     - `delete venues`
     - bulk insert / upsert（同一個 transaction 內）
   - 若任何步驟失敗，transaction rollback，舊資料保持不變

### C) 中英文欄位填充策略

欄位來源：

- 中文：
  - `name`：優先 `Name_tc`，其次 `Name_cn`，最後 `Name_en`
  - `address`：優先 `Address_tc`，其次 `Address_cn`，最後 `Address_en`
  - `district`：優先 `District_tc`，其次 `District_cn`，最後 `District_en`（再 normalize）
- 英文：
  - `nameEn`：`Name_en`（可空）
  - `addressEn`：`Address_en`（可空）
  - `districtEn`：優先 `District_en`；若空但有中文 `district`，用 `districtTranslations[district]` 做 fallback

district 中文 normalize：

- 沿用現有規則（補「區」等）

## 失敗策略／可觀察性

- Fetch 任一 source 失敗：記錄 error，但仍可繼續嘗試其他 source；最終如果「有效筆數 = 0」就視為整體失敗（不覆蓋 DB）。
- 最終成功／失敗都印出 summary：
  - sources 成功數、失敗數
  - 總寫入筆數

## 驗證（手動）

1. 跑 `pnpm -C /workspace/lib/db sync:lcsd`
2. 檢查：
   - `select count(*) from venues;` 應該 > 0
   - 抽樣檢查 `nameEn/addressEn/districtEn` 係咪有值（容許少量 null/空，視 LCSD 資料而定）
3. 前端打開「選擇球場」可以見到球場列表

