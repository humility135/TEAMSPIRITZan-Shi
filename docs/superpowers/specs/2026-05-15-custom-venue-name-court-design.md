# 私人球場：球場名稱 + 場號輸入（公開場主辦 / 球隊活動主辦）

## 背景
- 目前「揀球場」只可以由康文署場地清單選擇，私人球場會搜尋唔到。
- 目前頁面上嘅文字欄位（venueAddress）容易俾人理解成「球場名稱」或「場號」，用途唔清晰。
- 實際需求：
  - 私人球場必須可以輸入球場名稱。
  - 球場可能多於一個場，需要獨立輸入「場號/場地」。
  - 同一套做法要套用到：
    - 公開場主辦（Host Match）
    - 球隊活動主辦（Team Host Event）

## 目標
- 提供清晰嘅輸入：球場名稱（必填）+ 場號/場地（選填，自由文字）。
- 保留康文署球場搜尋（可選），揀到會自動填球場名稱同相關欄位。
- 顯示層面（列表/詳情）可見到「球場名 · 場號」。
- 不改動後端 schema；沿用現有 `venueId` + `venueAddress` 儲存。

## 非目標
- 不新增私人體育場座標/距離排序能力（無 venueId 時本來就無 lat/lng）。
- 不新增更完整嘅私人球場地址/導航欄位（現階段以 Google Maps 搜尋文字為主）。

## UI / UX（兩個主辦頁一致）
### 欄位（由上而下）
1. 康文署球場（可選）
   - 仍然使用現有 VenueSelector（搜尋 + 選擇）。
2. 球場名稱（必填）
   - 可直接輸入任意文字（私人球場）。
   - 如果揀咗康文署球場，會自動填入該場地名稱。
   - 若用家手動修改「球場名稱」並令其不再等於所選場地名稱，會自動清除 `venueId`（當成自訂球場）。
3. 場號/場地（選填）
   - 自由文字，例如：`1號場` / `7人硬地` / `A場`。

## 資料映射（不改後端 schema）
### 儲存策略
- `venueId`：只在康文署場地被選擇且「球場名稱」未被改動時保留；否則清空。
- `venueAddress`（沿用欄位名，實際承載「可展示嘅地點字串」）：
  - 若 `venueId` 有值：只存 `venueCourt`（場號/場地）；空則不傳/undefined。
  - 若 `venueId` 無值：存 `${venueName} ${venueCourt?}`（trim 後，單一空格分隔）。
- `district`：
  - 若有 venueId：用場地資料自動設定。
  - 若無 venueId：用 `detectDistrict(venueAddress)` 推算；推算唔到就會落入「其他」。
- `surface`：
  - 若有 venueId：用場地資料自動設定（Host Match 直接用 v.surface；Team Host Event 用舊有映射規則）。
  - 若無 venueId：由用家自行選擇。

## 顯示規則調整
### 公開場列表 / 詳情 / 其他引用（Discover、Public Match Detail、Dashboard、Profile）
- 現有 `venueLabel` 計算邏輯：優先用 `venue?.name`，否則用 `match.venueAddress`。
- 新增規則：若 `venue` 存在且 `match.venueAddress` 有值，顯示為：`{venueName} · {match.venueAddress}`（把場號附加到場地名）。
- 若 `venue` 不存在：沿用原本 `match.venueAddress` 顯示（此時已包含球場名稱 + 場號）。

## i18n
- 新增/更新字串：
  - Host Match：球場名稱 label/placeholder/helper、場號 label/placeholder/helper、康文署球場 label/helper 文案調整。
  - Team Host Event：同上。
- 不新增語言或翻譯策略；沿用現有 key-based translations。

## 測試
- 更新 `host-match.test.tsx`：
  - 改為輸入 `venueName` 而非 `venueAddress`。
  - 覆蓋場號輸入後 payload `venueAddress` 組合正確。
  - 覆蓋揀康文署場地 + 場號：payload `venueId` 存在，`venueAddress` 只係場號。
- 新增或更新 `team-host-event` 對應測試（如目前無測試則新增）：
  - 覆蓋同一組資料映射規則。
- 跑 `teamspirit` typecheck + vitest。

