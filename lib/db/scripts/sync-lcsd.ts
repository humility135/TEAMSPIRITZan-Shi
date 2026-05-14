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
  console.log("Starting LCSD Soccer Pitches Sync...");

  let okSources = 0;
  let failedSources = 0;
  const rows: VenueRow[] = [];

  for (const source of LCSD_SOURCES) {
    try {
      console.log(`Fetching ${source.description} from ${source.url}...`);
      const items = await fetchSource(source);
      console.log(`Received ${items.length} items.`);

      for (const item of items) {
        const row = toVenueRow(item, source);
        if (row) rows.push(row);
      }

      okSources += 1;
    } catch (e) {
      failedSources += 1;
      console.error(`Error syncing ${source.description}:`, e);
    }
  }

  if (rows.length === 0) {
    console.error("No valid venues parsed from LCSD sources. Database not modified.");
    process.exitCode = 1;
    return;
  }

  console.log(`Parsed ${rows.length} valid venue rows. Replacing DB contents...`);

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

  console.log("LCSD sync completed.");
  console.log(`sources_ok=${okSources} sources_failed=${failedSources} rows_written=${rows.length}`);
}

sync();
