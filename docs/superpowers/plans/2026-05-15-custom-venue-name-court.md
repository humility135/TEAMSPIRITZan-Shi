# 私人球場：球場名稱 + 場號輸入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 令用家喺主辦公開場/球隊活動時，無論係康文署或私人球場，都可以清晰輸入「球場名稱（必填）」+「場號/場地（選填）」並於列表/詳情顯示。

**Architecture:** 前端新增兩個表單欄位（venueName、venueCourt），提交時以現有後端欄位 `venueId` + `venueAddress` 儲存；顯示層面對 `venueLabel` 做拼接以呈現場號。

**Tech Stack:** React + react-hook-form + zod + shadcn/ui（teamspirit），Node/Express API 不改動。

---

## File Map
**Modify**
- `artifacts/teamspirit/src/pages/host-match.tsx`
- `artifacts/teamspirit/src/pages/team-host-event.tsx`
- `artifacts/teamspirit/src/lib/i18n.tsx`
- `artifacts/teamspirit/src/pages/discover.tsx`
- `artifacts/teamspirit/src/pages/public-match-detail.tsx`
- `artifacts/teamspirit/src/pages/dashboard.tsx`
- `artifacts/teamspirit/src/pages/profile.tsx`
- `artifacts/teamspirit/src/pages/team-detail.tsx`
- `artifacts/teamspirit/src/pages/event-detail.tsx`

**Test**
- `artifacts/teamspirit/src/pages/host-match.test.tsx`
- `artifacts/teamspirit/src/pages/team-host-event.test.tsx` (new)

---

### Task 1: i18n 新增欄位文案

**Files:**
- Modify: `artifacts/teamspirit/src/lib/i18n.tsx`

- [ ] **Step 1: 加入 Host Match / Team Host Event 新 key（中英）**

在 translations 內新增以下 key（只示範關鍵段落；實作時分別加入 zh/en 區塊）：

```ts
hostMatchLcsdVenueLabel: '康文署球場（可選）',
hostMatchVenueNameLabel: '球場名稱',
hostMatchVenueNamePlaceholder: '例如：九龍仔公園',
hostMatchVenueCourtLabel: '場號 / 場地（選填）',
hostMatchVenueCourtPlaceholder: '例如：1號場 / 7人硬地 / A場',

teamHostEventLcsdVenueLabel: '康文署球場（可選）',
teamHostEventVenueNameLabel: '球場名稱',
teamHostEventVenueNamePlaceholder: '例如：九龍仔公園',
teamHostEventVenueCourtLabel: '場號 / 場地（選填）',
teamHostEventVenueCourtPlaceholder: '例如：1號場 / 7人硬地 / A場',
```

- [ ] **Step 2: 跑 typecheck（只驗 i18n 無打錯 key）**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit typecheck
```

Expected: PASS

---

### Task 2: 公開場主辦（Host Match）加球場名稱 + 場號

**Files:**
- Modify: `artifacts/teamspirit/src/pages/host-match.tsx`
- Test: `artifacts/teamspirit/src/pages/host-match.test.tsx`

- [ ] **Step 1: 更新 form schema / defaultValues**

把 schema 由 `venueAddress` 改為：

```ts
return z.object({
  venueId: z.string().optional(),
  venueName: z.string().min(2, t('hostMatchVenueRequired')),
  venueCourt: z.string().optional(),
  district: z.string().optional(),
  date: z.string().min(1, t('hostMatchDateRequired')).refine(...),
  startTime: z.string().min(1, t('hostMatchStartTimeRequired')),
  endTime: z.string().min(1, t('hostMatchEndTimeRequired')),
  surface: z.enum(['hard', 'turf', 'grass']),
  skillLevel: z.coerce.number().min(1).max(5),
  maxPlayers: z.string().refine(...),
  fee: z.string().refine(...),
  description: z.string(),
  rules: z.string(),
});
```

defaultValues 新增：

```ts
venueName: '',
venueCourt: '',
```

- [ ] **Step 2: 更新 VenueSelector onSelect 行為**

選擇康文署球場時：
- set `venueId`
- set `venueName` = 選中球場嘅顯示名（跟隨當前語言）
- set `district` / `surface` 同現有邏輯一致
- 清空 `venueCourt`

- [ ] **Step 3: 新增「球場名稱 / 場號」兩個 Input，並移除舊 venueAddress Input**

FormField 改為 `venueName` + `venueCourt`：

```tsx
<FormField
  control={form.control}
  name="venueName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('hostMatchVenueNameLabel')}</FormLabel>
      <FormControl>
        <Input placeholder={t('hostMatchVenueNamePlaceholder')} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="venueCourt"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('hostMatchVenueCourtLabel')}</FormLabel>
      <FormControl>
        <Input placeholder={t('hostMatchVenueCourtPlaceholder')} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

- [ ] **Step 4: venueName 被手動修改時，自動清除 venueId**

在 `venueName` input 的 `onChange` 包一層：如果目前 `venueId` 有值，而且新 `venueName` 與選中 venue 名稱不同，就 `form.setValue('venueId', '')`。

- [ ] **Step 5: onSubmit 組合 payload venueAddress**

新增 helper（檔案內 function）：

```ts
function buildVenueAddress(venueName: string, venueCourt?: string) {
  const name = venueName.trim();
  const court = (venueCourt || '').trim();
  return court ? `${name} ${court}` : name;
}
```

提交時：
- `const venueId = values.venueId || undefined;`
- `const venueAddress = venueId ? (values.venueCourt?.trim() || undefined) : buildVenueAddress(values.venueName, values.venueCourt);`
- `district` 用 `venueId ? values.district : detectDistrict(venueAddress)`（或沿用既有 `values.district || detectDistrict(...)`）

- [ ] **Step 6: 更新 host-match.test.tsx**

把原本輸入 `input[name="venueAddress"]` 改成 `input[name="venueName"]`；新增場號輸入後驗證 payload：

```ts
await user.type(container.querySelector('input[name="venueName"]')!, "My Private Pitch");
await user.type(container.querySelector('input[name="venueCourt"]')!, "1號場");

expect(createPublicMatch).toHaveBeenCalledWith(
  expect.objectContaining({
    venueId: undefined,
    venueAddress: "My Private Pitch 1號場",
  })
);
```

- [ ] **Step 7: 跑 vitest**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit test
```

Expected: PASS

---

### Task 3: 球隊活動主辦（Team Host Event）加球場名稱 + 場號

**Files:**
- Modify: `artifacts/teamspirit/src/pages/team-host-event.tsx`
- Create: `artifacts/teamspirit/src/pages/team-host-event.test.tsx`

- [ ] **Step 1: 同步更新 schema / defaultValues（同 Host Match 一致）**

把 `venueAddress` 轉為 `venueName` + `venueCourt`，並保留 `venueId/district/surface`。

- [ ] **Step 2: 更新 VenueSelector onSelect 行為**

選擇康文署球場時：
- set `venueId`
- set `venueName` = 選中球場顯示名
- set `district` 同現有
- set `surface` 同現有規則（草/硬字串映射）
- 清空 `venueCourt`

- [ ] **Step 3: onSubmit 組合 venueAddress**

同 Host Match：
- 有 `venueId`：`venueAddress` 只係場號（可空）
- 無 `venueId`：`venueAddress` = `${venueName} ${venueCourt?}`

- [ ] **Step 4: 新增 team-host-event.test.tsx（最少 2 個測試）**

1) 私人球場組合：

```ts
await user.type(container.querySelector('input[name="venueName"]')!, "Private Venue");
await user.type(container.querySelector('input[name="venueCourt"]')!, "A場");

expect(createEvent).toHaveBeenCalledWith(
  expect.objectContaining({
    venueId: "",
    venueAddress: "Private Venue A場",
  })
);
```

2) 選擇康文署球場後只存場號（可用 mock VenueSelector component，類似 host-match.test.tsx 既做法）：

```ts
expect(createEvent).toHaveBeenCalledWith(
  expect.objectContaining({
    venueId: "v1",
    venueAddress: "1號場",
  })
);
```

- [ ] **Step 5: 跑 vitest**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit test
```

Expected: PASS

---

### Task 4: 列表 / 詳情顯示「球場名 · 場號」

**Files:**
- Modify: `artifacts/teamspirit/src/pages/discover.tsx`
- Modify: `artifacts/teamspirit/src/pages/public-match-detail.tsx`
- Modify: `artifacts/teamspirit/src/pages/dashboard.tsx`
- Modify: `artifacts/teamspirit/src/pages/profile.tsx`
- Modify: `artifacts/teamspirit/src/pages/team-detail.tsx`
- Modify: `artifacts/teamspirit/src/pages/event-detail.tsx`

- [ ] **Step 1: 公開場顯示規則**

把 `venueLabel` 計算改為（示意）：

```ts
const base = lang === 'en'
  ? (venue?.nameEn ?? match.venueAddressEn ?? match.venueAddress ?? '—')
  : (venue?.name ?? match.venueAddress ?? '—');

const venueLabel = venue && match.venueAddress
  ? `${lang === 'en' ? (venue.nameEn ?? venue.name) : venue.name} · ${match.venueAddress}`
  : base;
```

並套用到 Discover / PublicMatchDetail / Dashboard / Profile 等所有公開場 label 來源。

- [ ] **Step 2: 球隊活動顯示規則**

對 events（team-detail EventRow、event-detail、dashboard 內 event label）做同一個拼接：有 `venue` 且 `event.venueAddress` 有值，就顯示 `venueName · event.venueAddress`。

- [ ] **Step 3: 跑 typecheck + vitest**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit typecheck
pnpm -C /workspace/artifacts/teamspirit test
```

Expected: PASS

