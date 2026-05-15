# Dashboard HKO Weather by Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show Hong Kong Observatory (HKO) real-time weather on Dashboard based on the user's geolocation, refreshed every 10 minutes, including temperature, humidity, rainfall, and warnings.

**Architecture:** Add a backend proxy endpoint `/api/weather/nearby` that fetches HKO `rhrread` (tc/en), caches for 10 minutes, and computes a "nearest temperature station" using a small station-coordinate map. Frontend Dashboard calls that endpoint after geolocation succeeds via React Query and renders a weather card.

**Tech Stack:** React + TanStack Query + wouter (frontend), Express + drizzle (backend), HKO Open Data `rhrread` JSON, vitest (frontend tests).

---

## File Map (What changes where)

**Backend**
- Create: `/workspace/artifacts/api-server/src/routes/weather.ts`
- Modify: [/workspace/artifacts/api-server/src/routes/index.ts](file:///workspace/artifacts/api-server/src/routes/index.ts)

**Frontend**
- Modify: [/workspace/artifacts/teamspirit/src/pages/dashboard.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.tsx)
- Modify: [/workspace/artifacts/teamspirit/src/pages/dashboard.test.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.test.tsx)

---

### Task 1: Add backend `/weather/nearby` route with 10-min cache

**Files:**
- Create: `/workspace/artifacts/api-server/src/routes/weather.ts`
- Modify: [/workspace/artifacts/api-server/src/routes/index.ts](file:///workspace/artifacts/api-server/src/routes/index.ts)

- [ ] **Step 1: Create `weather.ts` route scaffold**

Create `/workspace/artifacts/api-server/src/routes/weather.ts`:

```ts
import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const Query = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  lang: z.enum(["tc", "en"]).default("tc"),
});

type HkoRhrread = {
  updateTime?: string;
  icon?: number[];
  iconUpdateTime?: string;
  warningMessage?: string[];
  temperature?: { recordTime?: string; data?: Array<{ place: string; value: number; unit: string }> };
  humidity?: { recordTime?: string; data?: Array<{ place: string; value: number; unit: string }> };
  rainfall?: { startTime?: string; endTime?: string; data?: Array<{ place: string; max: number; min?: number; unit: string; main?: string }> };
};

type NearbyWeather = {
  fetchedAt: string;
  lang: "tc" | "en";
  location: { lat: number; lng: number };
  temperature: { station: string; value: number; unit: string; recordTime: string; distanceKm?: number };
  humidity?: { value: number; unit: string; recordTime: string };
  rainfall?: { district: string; max: number; min?: number; unit: string; startTime: string; endTime: string };
  warnings: string[];
  icon?: number[];
  iconUpdateTime?: string;
  updateTime?: string;
};

type CacheEntry = { at: number; payload: HkoRhrread };
const CACHE_TTL_MS = 10 * 60 * 1000;
const cacheByLang = new Map<"tc" | "en", CacheEntry>();

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Minimal station coordinate map (extendable). Keys match HKO `temperature.data[].place` values.
const stationCoords: Record<string, { lat: number; lng: number }> = {
  "Hong Kong Observatory": { lat: 22.301944, lng: 114.174167 },
  "King's Park": { lat: 22.311944, lng: 114.172222 },
  "Kwun Tong": { lat: 22.3133, lng: 114.2250 },
  "Wong Tai Sin": { lat: 22.3417, lng: 114.1936 },
  "Sha Tin": { lat: 22.3836, lng: 114.1933 },
  "Tai Po": { lat: 22.4500, lng: 114.1667 },
  "Tuen Mun": { lat: 22.3917, lng: 113.9767 },
  "Tsuen Wan": { lat: 22.3736, lng: 114.1111 },
  "Yuen Long Park": { lat: 22.4450, lng: 114.0220 },
  "Chek Lap Kok": { lat: 22.3080, lng: 113.9185 },
  "Tsing Yi": { lat: 22.3483, lng: 114.1078 },
  "Tseung Kwan O": { lat: 22.3083, lng: 114.2600 },
  "Sai Kung": { lat: 22.3833, lng: 114.2667 },
};

const rainfallDistrictKeysByLang: Record<"tc" | "en", Record<string, string>> = {
  tc: {
    "Central & Western District": "中西區",
    "Eastern District": "東區",
    "Kwai Tsing": "葵青",
    "Islands District": "離島區",
    "North District": "北區",
    "Sai Kung": "西貢",
    "Sha Tin": "沙田",
    "Southern District": "南區",
    "Tai Po": "大埔",
    "Tsuen Wan": "荃灣",
    "Tuen Mun": "屯門",
    "Wan Chai": "灣仔",
    "Yuen Long": "元朗",
    "Yau Tsim Mong": "油尖旺",
    "Sham Shui Po": "深水埗",
    "Kowloon City": "九龍城",
    "Wong Tai Sin": "黃大仙",
    "Kwun Tong": "觀塘",
  },
  en: {
    "中西區": "Central & Western District",
    "東區": "Eastern District",
    "葵青": "Kwai Tsing",
    "離島區": "Islands District",
    "北區": "North District",
    "西貢": "Sai Kung",
    "沙田": "Sha Tin",
    "南區": "Southern District",
    "大埔": "Tai Po",
    "荃灣": "Tsuen Wan",
    "屯門": "Tuen Mun",
    "灣仔": "Wan Chai",
    "元朗": "Yuen Long",
    "油尖旺": "Yau Tsim Mong",
    "深水埗": "Sham Shui Po",
    "九龍城": "Kowloon City",
    "黃大仙": "Wong Tai Sin",
    "觀塘": "Kwun Tong",
  },
};

async function fetchRhrread(lang: "tc" | "en"): Promise<HkoRhrread> {
  const cached = cacheByLang.get(lang);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.payload;

  const url = `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HKO ${res.status}`);
  const json = (await res.json()) as HkoRhrread;
  cacheByLang.set(lang, { at: Date.now(), payload: json });
  return json;
}

function pickNearestTemperature(
  lat: number,
  lng: number,
  temps: Array<{ place: string; value: number; unit: string }>,
  recordTime: string,
) {
  let best: { station: string; value: number; unit: string; recordTime: string; distanceKm?: number } | null = null;
  for (const t of temps) {
    const coord = stationCoords[t.place];
    if (!coord) continue;
    const d = haversineKm(lat, lng, coord.lat, coord.lng);
    if (!Number.isFinite(d)) continue;
    if (!best || (best.distanceKm ?? Infinity) > d) {
      best = { station: t.place, value: t.value, unit: t.unit, recordTime, distanceKm: d };
    }
  }
  if (best) return best;

  const fallback = temps.find((t) => t.place === "Hong Kong Observatory") ?? temps[0];
  return { station: fallback?.place ?? "Hong Kong Observatory", value: fallback?.value ?? 0, unit: fallback?.unit ?? "C", recordTime };
}

function pickHumidity(h: HkoRhrread["humidity"]) {
  const recordTime = h?.recordTime ?? new Date().toISOString();
  const first = h?.data?.[0];
  if (!first) return undefined;
  return { value: first.value, unit: first.unit, recordTime };
}

function pickRainfallByNearestDistrict(
  lat: number,
  lng: number,
  lang: "tc" | "en",
  r: HkoRhrread["rainfall"],
) {
  const startTime = r?.startTime ?? "";
  const endTime = r?.endTime ?? "";
  const list = r?.data ?? [];
  if (list.length === 0) return undefined;

  // Use nearest *district key* based on a short list of district representative points.
  const districtCenters: Record<string, { lat: number; lng: number }> = lang === "en"
    ? {
        "Central & Western District": { lat: 22.2869, lng: 114.1540 },
        "Wan Chai": { lat: 22.2797, lng: 114.1717 },
        "Eastern District": { lat: 22.2806, lng: 114.2222 },
        "Southern District": { lat: 22.2475, lng: 114.1586 },
        "Yau Tsim Mong": { lat: 22.3193, lng: 114.1694 },
        "Sham Shui Po": { lat: 22.3300, lng: 114.1622 },
        "Kowloon City": { lat: 22.3282, lng: 114.1916 },
        "Wong Tai Sin": { lat: 22.3417, lng: 114.1936 },
        "Kwun Tong": { lat: 22.3133, lng: 114.2250 },
        "Kwai Tsing": { lat: 22.3600, lng: 114.1000 },
        "Tsuen Wan": { lat: 22.3736, lng: 114.1111 },
        "Tuen Mun": { lat: 22.3917, lng: 113.9767 },
        "Yuen Long": { lat: 22.4450, lng: 114.0220 },
        "North District": { lat: 22.5000, lng: 114.1333 },
        "Tai Po": { lat: 22.4500, lng: 114.1667 },
        "Sha Tin": { lat: 22.3836, lng: 114.1933 },
        "Sai Kung": { lat: 22.3833, lng: 114.2667 },
        "Islands District": { lat: 22.2611, lng: 113.9461 },
      }
    : {
        "中西區": { lat: 22.2869, lng: 114.1540 },
        "灣仔": { lat: 22.2797, lng: 114.1717 },
        "東區": { lat: 22.2806, lng: 114.2222 },
        "南區": { lat: 22.2475, lng: 114.1586 },
        "油尖旺": { lat: 22.3193, lng: 114.1694 },
        "深水埗": { lat: 22.3300, lng: 114.1622 },
        "九龍城": { lat: 22.3282, lng: 114.1916 },
        "黃大仙": { lat: 22.3417, lng: 114.1936 },
        "觀塘": { lat: 22.3133, lng: 114.2250 },
        "葵青": { lat: 22.3600, lng: 114.1000 },
        "荃灣": { lat: 22.3736, lng: 114.1111 },
        "屯門": { lat: 22.3917, lng: 113.9767 },
        "元朗": { lat: 22.4450, lng: 114.0220 },
        "北區": { lat: 22.5000, lng: 114.1333 },
        "大埔": { lat: 22.4500, lng: 114.1667 },
        "沙田": { lat: 22.3836, lng: 114.1933 },
        "西貢": { lat: 22.3833, lng: 114.2667 },
        "離島區": { lat: 22.2611, lng: 113.9461 },
      };

  let nearestDistrictKey: string | null = null;
  let nearestDist = Infinity;
  for (const [k, c] of Object.entries(districtCenters)) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < nearestDist) { nearestDist = d; nearestDistrictKey = k; }
  }
  if (!nearestDistrictKey) return undefined;

  const targetName = nearestDistrictKey;
  const mapped = rainfallDistrictKeysByLang[lang][targetName] ?? targetName;
  const item = list.find((x) => x.place === mapped) ?? list.find((x) => x.place === targetName) ?? list[0];
  return { district: item.place, max: item.max, min: item.min, unit: item.unit, startTime, endTime };
}

router.get("/weather/nearby", async (req, res): Promise<void> => {
  const parsed = Query.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { lat, lng, lang } = parsed.data;
  if (!isFiniteNum(lat) || !isFiniteNum(lng)) { res.status(400).json({ error: "Invalid lat/lng" }); return; }

  try {
    const raw = await fetchRhrread(lang);
    const temps = raw.temperature?.data ?? [];
    const recordTime = raw.temperature?.recordTime ?? raw.updateTime ?? new Date().toISOString();
    const temperature = pickNearestTemperature(lat, lng, temps, recordTime);
    const humidity = pickHumidity(raw.humidity);
    const rainfall = pickRainfallByNearestDistrict(lat, lng, lang, raw.rainfall);
    const warnings = Array.isArray(raw.warningMessage) ? raw.warningMessage : [];

    const payload: NearbyWeather = {
      fetchedAt: new Date().toISOString(),
      lang,
      location: { lat, lng },
      temperature,
      humidity,
      rainfall,
      warnings,
      icon: raw.icon,
      iconUpdateTime: raw.iconUpdateTime,
      updateTime: raw.updateTime,
    };
    res.json(payload);
  } catch {
    res.status(502).json({ error: "HKO fetch failed" });
  }
});

export default router;
```

- [ ] **Step 2: Register route**

Modify [/workspace/artifacts/api-server/src/routes/index.ts](file:///workspace/artifacts/api-server/src/routes/index.ts):

```ts
import weatherRouter from "./weather";
// ...
router.use(weatherRouter);
```

- [ ] **Step 3: Backend typecheck**

Run:

```bash
pnpm -C /workspace/lib/db exec tsc -b
pnpm -C /workspace/lib/api-zod exec tsc -b
pnpm -C /workspace/artifacts/api-server typecheck
```

Expected: PASS.

---

### Task 2: Add Weather card to Dashboard with 10-min refresh

**Files:**
- Modify: [/workspace/artifacts/teamspirit/src/pages/dashboard.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.tsx)
- Modify: [/workspace/artifacts/teamspirit/src/pages/dashboard.test.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.test.tsx)

- [ ] **Step 1: Add types locally (minimal)**

Inside `dashboard.tsx` add:

```ts
type NearbyWeather = {
  fetchedAt: string;
  lang: "tc" | "en";
  location: { lat: number; lng: number };
  temperature: { station: string; value: number; unit: string; recordTime: string; distanceKm?: number };
  humidity?: { value: number; unit: string; recordTime: string };
  rainfall?: { district: string; max: number; min?: number; unit: string; startTime: string; endTime: string };
  warnings: string[];
  updateTime?: string;
};
```

- [ ] **Step 2: Add weather query**

Import:

```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
```

Add:

```ts
const weatherQ = useQuery({
  queryKey: ["nearbyWeather", userLocation?.lat, userLocation?.lng, lang],
  queryFn: () => api<NearbyWeather>(`/weather/nearby?lat=${userLocation!.lat}&lng=${userLocation!.lng}&lang=${lang === "en" ? "en" : "tc"}`),
  enabled: !!userLocation,
  refetchInterval: 10 * 60 * 1000,
});
```

- [ ] **Step 3: Render Weather card**

Add a `Card` near the top of dashboard content:
- Show temperature + station
- Show humidity if available
- Show rainfall if available
- Show first warning if any (and optionally a count)

Example snippet:

```tsx
{userLocation && (
  <Card className="p-6 border-border bg-card/50 backdrop-blur">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-xs text-muted-foreground font-bold tracking-wider uppercase">
          {lang === "en" ? "Nearby Weather" : "附近天氣"}
        </div>
        {weatherQ.data ? (
          <div className="mt-2 space-y-1">
            <div className="text-3xl font-display font-bold text-white">
              {weatherQ.data.temperature.value}°{weatherQ.data.temperature.unit}
            </div>
            <div className="text-xs text-muted-foreground">
              {weatherQ.data.temperature.station}
              {weatherQ.data.temperature.distanceKm != null ? ` · ${weatherQ.data.temperature.distanceKm.toFixed(1)}km` : ""}
            </div>
            {weatherQ.data.humidity && (
              <div className="text-sm text-muted-foreground">
                {lang === "en" ? "Humidity" : "濕度"} {weatherQ.data.humidity.value}{weatherQ.data.humidity.unit}
              </div>
            )}
            {weatherQ.data.rainfall && (
              <div className="text-sm text-muted-foreground">
                {lang === "en" ? "Rainfall (last hour)" : "近一小時雨量"} {weatherQ.data.rainfall.max}{weatherQ.data.rainfall.unit} · {weatherQ.data.rainfall.district}
              </div>
            )}
          </div>
        ) : weatherQ.isError ? (
          <div className="mt-2 text-sm text-muted-foreground">
            {lang === "en" ? "Weather temporarily unavailable." : "暫時未能取得天氣資料。"}
          </div>
        ) : (
          <div className="mt-2 text-sm text-muted-foreground">
            {lang === "en" ? "Loading..." : "載入中…"}
          </div>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {weatherQ.data?.updateTime ? `${lang === "en" ? "Updated" : "更新"} ${new Date(weatherQ.data.updateTime).toLocaleTimeString(lang === "en" ? "en-US" : "zh-HK", { hour: "2-digit", minute: "2-digit" })}` : ""}
      </div>
    </div>
    {weatherQ.data?.warnings?.length ? (
      <div className="mt-4 text-xs border border-amber-500/30 bg-amber-500/10 text-amber-100 rounded-lg p-3">
        {weatherQ.data.warnings[0]}
      </div>
    ) : null}
  </Card>
)}
```

- [ ] **Step 4: Update Dashboard test**

Modify [/workspace/artifacts/teamspirit/src/pages/dashboard.test.tsx](file:///workspace/artifacts/teamspirit/src/pages/dashboard.test.tsx):
- Mock `@/lib/geo` to resolve `getUserLocation()` with a fixed HK coord.
- Mock `@/lib/api` to return a sample NearbyWeather.
- Assert that the weather card renders something like `"附近天氣"` or `"Nearby Weather"` and a temperature value.

Example:

```ts
vi.mock("@/lib/geo", () => ({
  getUserLocation: async () => ({ coords: { latitude: 22.31, longitude: 114.22 } }),
  getDistance: () => 0,
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn(async () => ({
    fetchedAt: new Date().toISOString(),
    lang: "tc",
    location: { lat: 22.31, lng: 114.22 },
    temperature: { station: "觀塘", value: 24, unit: "C", recordTime: new Date().toISOString() },
    humidity: { value: 90, unit: "percent", recordTime: new Date().toISOString() },
    rainfall: { district: "觀塘", max: 0, unit: "mm", startTime: "", endTime: "" },
    warnings: [],
  })),
}));
```

Then:

```ts
expect(queryByText("附近天氣")).toBeInTheDocument();
expect(queryByText(/24/)).toBeInTheDocument();
```

- [ ] **Step 5: Frontend typecheck + tests**

Run:

```bash
pnpm -C /workspace/artifacts/teamspirit typecheck
pnpm -C /workspace/artifacts/teamspirit test
```

Expected: PASS.

---

### Task 3: Manual smoke test

- [ ] **Step 1: Start servers**

```bash
pnpm -C /workspace/artifacts/api-server dev
pnpm -C /workspace/artifacts/teamspirit dev -- --port 3000
```

- [ ] **Step 2: Verify behavior**
- Open Dashboard and allow location:
  - Weather card appears
  - Shows temperature + humidity + rainfall + warning (if any)
  - Reload page: still works
- Deny location:
  - Weather card does not show (or shows a simple prompt)

