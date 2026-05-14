# LCSD Venues Sync (Bilingual) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore LCSD venues in the app by adding a safe, repeatable manual sync command that imports LCSD soccer pitches into `venues` with both Chinese + English fields.

**Architecture:** Add a `pnpm` script under `lib/db` to run the existing LCSD sync script via `tsx`. Refactor the sync script into a 2-phase pipeline (fetch/parse → transactional replace) so the DB is only overwritten when we have valid data.

**Tech Stack:** TypeScript (Node 24), Drizzle ORM (SQLite / libsql), pnpm workspaces, Express API, Vite frontend.

---

## File Map

**Modify**
- [sync-lcsd.ts](file:///workspace/lib/db/scripts/sync-lcsd.ts) — refactor to safe 2-phase import + district EN fallback + summary output
- [package.json](file:///workspace/lib/db/package.json) — add `sync:lcsd` script + `tsx` devDependency

**Create**
- `lib/db/scripts/verify-venues.ts` — small smoke-check script used in verification steps

---

### Task 1: Add a Manual Sync Command (`pnpm -C lib/db sync:lcsd`)

**Files:**
- Modify: [package.json](file:///workspace/lib/db/package.json)

- [ ] **Step 1: Update `lib/db/package.json` scripts + devDependencies**

Update the file to include:

```json
{
  "scripts": {
    "push": "drizzle-kit push --config ./drizzle.config.ts",
    "push-force": "drizzle-kit push --force --config ./drizzle.config.ts",
    "sync:lcsd": "tsx ./scripts/sync-lcsd.ts",
    "verify:venues": "tsx ./scripts/verify-venues.ts"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "@types/pg": "^8.18.0",
    "drizzle-kit": "^0.31.9",
    "tsx": "catalog:"
  }
}
```

Notes:
- Keep existing fields intact; only add `sync:lcsd`, `verify:venues`, and `tsx`.
- `tsx` is already used in `@workspace/scripts`, but `lib/db` needs it locally to run scripts directly via `pnpm -C`.

- [ ] **Step 2: Install deps (if needed)**

Run (workspace root):

```bash
pnpm install --frozen-lockfile
```

Expected:
- Exit code 0
- `tsx` becomes available under `lib/db/node_modules/.bin/tsx`

- [ ] **Step 3: Sanity-check the command wiring**

Run:

```bash
pnpm -C /workspace/lib/db verify:venues
```

Expected:
- It fails for now (because the script doesn’t exist yet). This is OK; Task 3 will add it.

---

### Task 2: Make LCSD Sync Safe (Fetch/Parse → Transactional Replace)

**Files:**
- Modify: [sync-lcsd.ts](file:///workspace/lib/db/scripts/sync-lcsd.ts)

- [ ] **Step 1: Replace `sync-lcsd.ts` with the refactored implementation**

Replace the entire file content with:

```ts
import { db } from "../src/index";
import { venuesTable } from "../src/schema/venues";
import crypto from "crypto";

const LCSD_SOURCES = [
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-sp11atp.json",
    surface: "turf",
    description: "11人仿真草",
  },
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-sp7atp.json",
    surface: "turf",
    description: "7人仿真草",
  },
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-sp11ntp.json",
    surface: "grass",
    description: "11人真草",
  },
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-hssp5.json",
    surface: "hard",
    description: "5人硬地",
  },
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-hssp7.json",
    surface: "hard",
    description: "7人硬地",
  },
] as const;

const districtTranslations: Record<string, string> = {
  中西區: "Central & Western",
  灣仔區: "Wan Chai",
  東區: "Eastern",
  南區: "Southern",
  油尖旺區: "Yau Tsim Mong",
  深水埗區: "Sham Shui Po",
  九龍城區: "Kowloon City",
  黃大仙區: "Wong Tai Sin",
  觀塘區: "Kwun Tong",
  葵青區: "Kwai Tsing",
  荃灣區: "Tsuen Wan",
  屯門區: "Tuen Mun",
  元朗區: "Yuen Long",
  北區: "Northern",
  大埔區: "Tai Po",
  沙田區: "Sha Tin",
  西貢區: "Sai Kung",
  離島區: "Islands",
  其他: "Other",
};

function generateId(name: string, address: string) {
  return crypto.createHash("md5").update(`${name}-${address}`).digest("hex");
}

function parseCoord(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val || typeof val !== "string") return 0;
  if (val.includes("-")) {
    const parts = val.split("-").map(Number);
    if (parts.length === 3) return parts[0] + parts[1] / 60 + parts[2] / 3600;
    if (parts.length === 2) return parts[0] + parts[1] / 60;
  }
  const parsed = parseFloat(val);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeDistrict(districtRaw: string): string {
  let district = (districtRaw ?? "").trim();
  if (!district) return "其他";
  if (district === "油尖旺") district = "油尖旺區";
  if (district === "深水埗") district = "深水埗區";
  if (district === "九龍城") district = "九龍城區";
  if (district === "黃大仙") district = "黃大仙區";
  if (district.length <= 3 && !district.endsWith("區")) district = `${district}區`;
  return district;
}

type LcsdItem = {
  Name_tc?: string;
  Name_cn?: string;
  Name_en?: string;
  Address_tc?: string;
  Address_cn?: string;
  Address_en?: string;
  District_tc?: string;
  District_cn?: string;
  District_en?: string;
  Latitude?: string | number;
  Longitude?: string | number;
};

type VenueRow = {
  id: string;
  name: string;
  nameEn: string;
  address: string;
  addressEn: string;
  district: string;
  districtEn: string;
  lat: number;
  lng: number;
  surface: "turf" | "grass" | "hard";
  weather: { temp: number; condition: string; lightningWarning: boolean };
};

async function fetchSource(source: (typeof LCSD_SOURCES)[number]): Promise<LcsdItem[]> {
  const res = await fetch(source.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data as LcsdItem[];
}

function toVenueRow(
  item: LcsdItem,
  source: (typeof LCSD_SOURCES)[number],
): VenueRow | null {
  const name = item.Name_tc || item.Name_cn || item.Name_en || "";
  const nameEn = item.Name_en || "";
  const address = item.Address_tc || item.Address_cn || item.Address_en || "";
  const addressEn = item.Address_en || "";
  const districtZhRaw = item.District_tc || item.District_cn || item.District_en || "";
  const district = normalizeDistrict(districtZhRaw);
  const districtEn = (item.District_en || districtTranslations[district] || "").trim();

  const lat = parseCoord(item.Latitude);
  const lng = parseCoord(item.Longitude);

  if (!name || !address || !lat || !lng) return null;

  const id = generateId(name, address);

  return {
    id,
    name,
    nameEn,
    address,
    addressEn,
    district,
    districtEn,
    lat,
    lng,
    surface: source.surface,
    weather: { temp: 20, condition: "Sunny", lightningWarning: false },
  };
}

async function sync() {
  console.log("🚀 Starting LCSD Soccer Pitches Sync...");

  let okSources = 0;
  let failedSources = 0;
  const rows: VenueRow[] = [];

  for (const source of LCSD_SOURCES) {
    try {
      console.log(`📡 Fetching ${source.description} from ${source.url}...`);
      const items = await fetchSource(source);
      console.log(`✅ Received ${items.length} items.`);

      for (const item of items) {
        const row = toVenueRow(item, source);
        if (row) rows.push(row);
      }

      okSources += 1;
    } catch (e) {
      failedSources += 1;
      console.error(`❌ Error syncing ${source.description}:`, e);
    }
  }

  if (rows.length === 0) {
    console.error("🛑 No valid venues parsed from LCSD sources. Database not modified.");
    process.exit(1);
  }

  console.log(`🧾 Parsed ${rows.length} valid venue rows. Replacing DB contents...`);

  await db.transaction(async (tx) => {
    await tx.delete(venuesTable);
    for (const row of rows) {
      await tx
        .insert(venuesTable)
        .values(row)
        .onConflictDoUpdate({
          target: venuesTable.id,
          set: row,
        });
    }
  });

  console.log("🏁 LCSD sync completed.");
  console.log(`📊 sources_ok=${okSources} sources_failed=${failedSources} rows_written=${rows.length}`);
  process.exit(0);
}

sync();
```

- [ ] **Step 2: Run TypeScript typecheck for the `db` package**

Run:

```bash
pnpm -C /workspace/lib/db typecheck
```

Expected:
- Exit code 0

- [ ] **Step 3: Manual run of sync script**

Run:

```bash
pnpm -C /workspace/lib/db sync:lcsd
```

Expected:
- Prints `Parsed <N> valid venue rows`
- Exit code 0

---

### Task 3: Add a Venue Smoke-Verification Script

**Files:**
- Create: `lib/db/scripts/verify-venues.ts`

- [ ] **Step 1: Create `lib/db/scripts/verify-venues.ts`**

```ts
import { db, venuesTable } from "../src/index";

async function main() {
  const venues = await db.select().from(venuesTable).limit(20);
  if (venues.length === 0) {
    console.error("venues is empty");
    process.exit(1);
  }

  const samples = venues.slice(0, 5).map((v) => ({
    id: v.id,
    name: v.name,
    nameEn: v.nameEn,
    district: v.district,
    districtEn: v.districtEn,
    address: v.address,
    addressEn: v.addressEn,
  }));

  console.log(JSON.stringify({ count: venues.length, samples }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run the verifier**

Run:

```bash
pnpm -C /workspace/lib/db verify:venues
```

Expected:
- Exit code 0
- Output includes samples showing both `name` and `nameEn` fields (English may be empty for some entries, but generally present for LCSD sources).

---

### Task 4: End-to-End Verification (DB → API → Frontend)

**Files:**
- None (verification only)

- [ ] **Step 1: Confirm DB has venues**

Run:

```bash
sqlite3 /workspace/sqlite.db "select count(*) from venues;"
```

Expected:
- A number > 0

- [ ] **Step 2: Confirm API returns venues**

If API server isn’t running, start it:

```bash
PORT=5003 pnpm -C /workspace/artifacts/api-server dev
```

Then verify:

```bash
curl -sS http://127.0.0.1:5003/api/venues | python -c "import json,sys;print(len(json.load(sys.stdin)))"
```

Expected:
- A number > 0

- [ ] **Step 3: Confirm frontend “選擇球場” shows options**

If frontend isn’t running, start it:

```bash
PORT=3000 pnpm -C /workspace/artifacts/teamspirit dev
```

Manual check:
- Open the page that uses VenueSelector (e.g. discover / create match flow where venue selection appears)
- Ensure the venue dropdown contains LCSD venues
- Switch language to English and confirm it displays English venue/district/address where available (with fallback to Chinese otherwise)

---

## Plan Self-Review

- Spec coverage: adds `sync:lcsd` command, makes overwrite safe, ensures bilingual fields, includes smoke verifier, and verifies DB/API/UI.
- Placeholder scan: no TBD/TODO; all steps have concrete code/commands.
- Type consistency: `venuesTable` fields match [venues.ts](file:///workspace/lib/db/src/schema/venues.ts).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-14-lcsd-venues-sync.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — Execute tasks in this session with checkpoints

Which approach?

