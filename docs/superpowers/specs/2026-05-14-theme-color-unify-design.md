# TEAMSPIRIT：免費版／專業版主題色一致化設計稿

日期：2026-05-14  
範圍：`artifacts/teamspirit`（前端）

## 背景／問題

- 現時前端會根據 `isProMode`（實際上等同 `me.subscription === 'pro'`）在執行期覆寫 CSS 變數 `--primary` 與 `--ring`。
- 在非專業模式時，`--primary`/`--ring` 會被改為灰白色，導致免費版主題色與專業版不一致。
- 但在 CSS（`:root` / `.dark`）內，預設主色已設定為綠色，執行期覆寫屬額外行為。

## 目標

1. 免費版與專業版全站主題色一致（同一組 `--primary` / `--ring`）。
2. 保留專業版可選的「額外視覺效果」：以 `pro-mode` class 作為專業版樣式 hook（例如 sidebar glow / premium card），但不再用它切換主色。

## 非目標

- 不調整實際主色數值（沿用現有 CSS 預設之 Neon Volt Green）。
- 不調整訂閱邏輯（仍由 `me.subscription` 決定是否為專業用戶）。
- 不重構 theme 系統（僅移除/簡化不必要的覆寫）。

## 現況盤點

- 主題色預設值（綠色）已存在於：
  - [index.css](file:///workspace/artifacts/teamspirit/src/index.css)
    - `:root` 與 `.dark` 的 `--primary`/`--ring`
- 執行期覆寫（造成免費版變灰）位於：
  - [store.tsx](file:///workspace/artifacts/teamspirit/src/lib/store.tsx#L186-L198)
    - `useEffect` 內依 `state.isProMode` 以 `document.documentElement.style.setProperty(...)` 覆寫 `--primary`/`--ring`

## 設計方案（採用 A）

### 行為

- 不論免費版或專業版：
  - `--primary` / `--ring` 均由 CSS（`:root` / `.dark`）決定，保持一致。
- 專業版：
  - 保留 `document.documentElement.classList.add('pro-mode')` 作為專業版視覺效果的開關。
- 免費版：
  - 保留 `classList.remove('pro-mode')`，以移除專業版額外效果。

### 具體修改

在 `store.tsx` 的「Pro mode CSS vars」段落：
- 移除 `setProperty('--primary', ...)` 與 `setProperty('--ring', ...)` 兩個覆寫分支。
- 僅保留對 `pro-mode` class 的 add/remove。

## 驗證／驗收標準

1. 無論使用免費帳戶或專業帳戶：
   - 主要互動元件（按鈕、焦點外框）主色一致（綠色）。
2. 專業帳戶仍會啟用 `pro-mode` 額外效果（例如 sidebar glow、premium-card 外觀）。
3. `pnpm -C artifacts/teamspirit typecheck` 可通過。

