# Dashboard Weather Refresh Icon + Fallback District Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard 天氣卡「有定位就跟用家、冇定位就 fallback 天文台」，並把「允許定位」文字按鈕改成右上角 refresh icon，同時 fallback 時雨量地區顯示「天文台附近」避免誤會。

**Architecture:** 前端仍然於 Dashboard 載入時自動嘗試 `navigator.geolocation`（透過 `getUserLocation()`）。天氣資料永遠由 `/api/weather/nearby` 取得：有定位用 user lat/lng，否則用天文台 fallback 座標。UI 右上角提供 icon-only refresh 重新取定位（並刷新天氣）。

**Tech Stack:** React + TanStack React Query + lucide-react + shadcn/ui Button + Vitest + Testing Library

---

### Task 1: 把「允許定位」按鈕改成 refresh icon（仍可觸發重新取定位）

**Files:**
- Modify: [dashboard.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.tsx)
- Test: [dashboard.test.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.test.tsx)

- [ ] **Step 1: 寫/調整測試（確保 icon button 仍可被 a11y name 找到並可 click）**

在 `allows retrying location to load nearby weather` 測試維持用 `findByRole("button", { name: "允許定位" })`（因為 icon-only button 會用 `aria-label`），確保 click 後 `getUserLocation` call count 會增加（現有測試已覆蓋，若因改動失效先修正）。

- [ ] **Step 2: 更新 Dashboard icon import**

在 `dashboard.tsx` 的 lucide import 加入 `RefreshCw`：

```ts
import { /* ... */, AlertTriangle, RefreshCw } from 'lucide-react';
```

- [ ] **Step 3: 把文字按鈕改為 icon-only**

把原本右上角：

```tsx
<Button variant="outline" size="sm" ...>
  {lang === 'en' ? (userLocation ? 'Refresh location' : 'Enable location') : (userLocation ? '更新定位' : '允許定位')}
</Button>
```

改為：

```tsx
<Button
  variant="outline"
  size="icon"
  disabled={locationLoading}
  onClick={requestLocation}
  aria-label={lang === 'en' ? (userLocation ? 'Refresh location' : 'Enable location') : (userLocation ? '更新定位' : '允許定位')}
>
  <RefreshCw className="w-4 h-4" />
</Button>
```

- [ ] **Step 4: 令 refresh icon 同時刷新天氣（除咗取定位）**

將 `requestLocation` 改成同時呼叫 `nearbyWeatherQ.refetch()`（即使定位失敗，都會更新一次天文台 fallback 天氣）：

```ts
const requestLocation = () => {
  setLocationLoading(true);
  getUserLocation()
    .then(pos => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })
    .catch(() => {})
    .finally(() => setLocationLoading(false));
  nearbyWeatherQ.refetch();
};
```

注意：為避免 TDZ，確保 `nearbyWeatherQ` 定義在 `requestLocation` 之前（把 `useQuery(...)` block 放到 `requestLocation` 上面即可）。

- [ ] **Step 5: 跑前端單測**

Run: `pnpm -C artifacts/teamspirit test`
Expected: PASS（`dashboard.test.tsx` 應該維持 3 tests 全過）

- [ ] **Step 6: Commit**

```bash
git add artifacts/teamspirit/src/pages/dashboard.tsx artifacts/teamspirit/src/pages/dashboard.test.tsx
git commit -m "feat(teamspirit): change weather location button to refresh icon"
```

### Task 2: Fallback（未授權定位）時雨量地區顯示「天文台附近」

**Files:**
- Modify: [dashboard.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.tsx)
- Test: [dashboard.test.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.test.tsx)

- [ ] **Step 1: 先寫 failing test（fallback 時唔應顯示 API 回傳 district）**

在 `renders weather even without location by falling back to HKO` 加 assertion：

```ts
expect(await screen.findByText("天文台附近")).toBeInTheDocument();
expect(screen.queryByText("油尖旺")).not.toBeInTheDocument();
```

（測試目前 mock API rainfall.district = "油尖旺"，所以應該會 fail，作為保護）

- [ ] **Step 2: 實作 district label 顯示邏輯**

在 rainfall 卡片的 district 行，改成：

```tsx
{nearbyWeatherQ.data?.rainfall && (
  <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[140px]">
    {userLocation
      ? nearbyWeatherQ.data.rainfall.district
      : (lang === 'en' ? 'Near HKO' : '天文台附近')}
  </div>
)}
```

（保持 rainfall 數值仍顯示 `max`）

- [ ] **Step 3: 跑前端單測**

Run: `pnpm -C artifacts/teamspirit test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add artifacts/teamspirit/src/pages/dashboard.tsx artifacts/teamspirit/src/pages/dashboard.test.tsx
git commit -m "fix(teamspirit): show HKO district label when location is unavailable"
```

### Task 3: 本地手動驗證（預覽）

**Files:**
- None (manual)

- [ ] **Step 1: 確保 api-server 正在運行**

Run: `pnpm -C artifacts/api-server start`
Expected: log 看到 `Server listening on 0.0.0.0` + `port: 5003`

- [ ] **Step 2: 啟動 teamspirit dev server**

Run: `pnpm -C artifacts/teamspirit exec vite --config vite.config.ts --host 0.0.0.0 --port 5174`
Expected: terminal 顯示 `Local: http://localhost:5174/`

- [ ] **Step 3: 驗證 UI**
- 未授權定位時：
  - 看到提示「未開定位：顯示香港天文台附近天氣。」
  - 雨量卡片底部地區顯示「天文台附近」而唔係「油尖旺」
  - 右上角只見 refresh icon（無「允許定位」文字）
- 授權定位後：
  - refresh icon 點擊後會更新定位（溫度 station / 雨量地區會合理跟你位置）
  - 天氣照樣每 10 分鐘自動更新（React Query `refetchInterval`）

---

## Plan Self-Review

- Spec 覆蓋：refresh icon / fallback district label / fallback 仍可用天氣卡（已覆蓋）
- Placeholder scan：無 TBD/TODO；每步都有具體 code/commands
- Type consistency：Dashboard weather response 已使用 backend `NearbyWeather` 結構；tests 同步

