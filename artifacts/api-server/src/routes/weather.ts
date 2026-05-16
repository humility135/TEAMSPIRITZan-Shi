import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";

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
  rainfall?: {
    startTime?: string;
    endTime?: string;
    data?: Array<{ place: string; max: number; min?: number; unit: string; main?: string }>;
  };
};

type HkoWarnsumEntry = {
  name?: string;
  code?: string;
  actionCode?: string;
};

type HkoWarnsum = Record<string, HkoWarnsumEntry | undefined>;

type NearbyWeatherWarning = {
  code: string;
  name: string;
};

type NearbyWeather = {
  fetchedAt: string;
  lang: "tc" | "en";
  location: { lat: number; lng: number };
  temperature: { station: string; value: number; unit: string; recordTime: string; distanceKm?: number };
  humidity?: { value: number; unit: string; recordTime: string };
  rainfall?: { district: string; max: number; min?: number; unit: string; startTime: string; endTime: string };
  warnings: NearbyWeatherWarning[];
  icon?: number[];
  iconUpdateTime?: string;
  updateTime?: string;
};

type CacheEntry = { at: number; payload: HkoRhrread };
const CACHE_TTL_MS = 10 * 60 * 1000;
const cacheByLang = new Map<"tc" | "en", CacheEntry>();
const warnsumCacheByLang = new Map<"tc" | "en", { at: number; payload: HkoWarnsum }>();

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const stationCoords: Record<string, { lat: number; lng: number }> = {
  "Hong Kong Observatory": { lat: 22.301944, lng: 114.174167 },
  "香港天文台": { lat: 22.301944, lng: 114.174167 },
  "King's Park": { lat: 22.311944, lng: 114.172222 },
  "京士柏": { lat: 22.311944, lng: 114.172222 },
  "Kwun Tong": { lat: 22.3133, lng: 114.225 },
  "觀塘": { lat: 22.3133, lng: 114.225 },
  "Wong Tai Sin": { lat: 22.3417, lng: 114.1936 },
  "黃大仙": { lat: 22.3417, lng: 114.1936 },
  "Sha Tin": { lat: 22.3836, lng: 114.1933 },
  "沙田": { lat: 22.3836, lng: 114.1933 },
  "Tai Po": { lat: 22.45, lng: 114.1667 },
  "大埔": { lat: 22.45, lng: 114.1667 },
  "Tuen Mun": { lat: 22.3917, lng: 113.9767 },
  "屯門": { lat: 22.3917, lng: 113.9767 },
  "Tsuen Wan": { lat: 22.3736, lng: 114.1111 },
  "荃灣": { lat: 22.3736, lng: 114.1111 },
  "Yuen Long Park": { lat: 22.445, lng: 114.022 },
  "元朗公園": { lat: 22.445, lng: 114.022 },
  "Chek Lap Kok": { lat: 22.308, lng: 113.9185 },
  "赤鱲角": { lat: 22.308, lng: 113.9185 },
  "Tsing Yi": { lat: 22.3483, lng: 114.1078 },
  "青衣": { lat: 22.3483, lng: 114.1078 },
  "Tseung Kwan O": { lat: 22.3083, lng: 114.26 },
  "將軍澳": { lat: 22.3083, lng: 114.26 },
  "Sai Kung": { lat: 22.3833, lng: 114.2667 },
  "西貢": { lat: 22.3833, lng: 114.2667 },
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
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  const res = await fetch(url, { signal: ctrl.signal });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`HKO ${res.status}`);
  const json = (await res.json()) as HkoRhrread;
  cacheByLang.set(lang, { at: Date.now(), payload: json });
  return json;
}

async function fetchWarnsum(lang: "tc" | "en"): Promise<HkoWarnsum> {
  const cached = warnsumCacheByLang.get(lang);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.payload;

  const url = `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=${lang}`;
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  const res = await fetch(url, { signal: ctrl.signal });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`HKO ${res.status}`);
  const json = (await res.json()) as HkoWarnsum;
  warnsumCacheByLang.set(lang, { at: Date.now(), payload: json });
  return json;
}

function extractActiveWarnings(raw: HkoWarnsum): NearbyWeatherWarning[] {
  const items: NearbyWeatherWarning[] = [];
  for (const v of Object.values(raw)) {
    const code = typeof v?.code === "string" ? v.code.trim() : "";
    const name = typeof v?.name === "string" ? v.name.trim() : "";
    const action = typeof v?.actionCode === "string" ? v.actionCode.trim() : "";
    if (!code || !name) continue;
    if (/cancel/i.test(action)) continue;
    items.push({ code, name });
  }
  items.sort((a, b) => a.code.localeCompare(b.code));
  return items;
}

function pickNearestTemperature(
  lat: number,
  lng: number,
  lang: "tc" | "en",
  temps: Array<{ place: string; value: number; unit: string }>,
  recordTime: string,
) {
  let best:
    | { station: string; value: number; unit: string; recordTime: string; distanceKm?: number }
    | null = null;
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

  const fallbackName = lang === "tc" ? "香港天文台" : "Hong Kong Observatory";
  const fallback = temps.find((t) => t.place === fallbackName) ?? temps[0];
  return {
    station: fallback?.place ?? fallbackName,
    value: fallback?.value ?? 0,
    unit: fallback?.unit ?? "C",
    recordTime,
  };
}

function pickHumidity(h: HkoRhrread["humidity"], lang: "tc" | "en") {
  const recordTime = h?.recordTime ?? new Date().toISOString();
  const target = lang === "tc" ? "香港天文台" : "Hong Kong Observatory";
  const item = h?.data?.find((x) => x.place === target) ?? h?.data?.[0];
  if (!item) return undefined;
  return { value: item.value, unit: item.unit, recordTime };
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

  const districtCenters: Record<string, { lat: number; lng: number }> =
    lang === "en"
      ? {
          "Central & Western District": { lat: 22.2869, lng: 114.154 },
          "Wan Chai": { lat: 22.2797, lng: 114.1717 },
          "Eastern District": { lat: 22.2806, lng: 114.2222 },
          "Southern District": { lat: 22.2475, lng: 114.1586 },
          "Yau Tsim Mong": { lat: 22.3193, lng: 114.1694 },
          "Sham Shui Po": { lat: 22.33, lng: 114.1622 },
          "Kowloon City": { lat: 22.3282, lng: 114.1916 },
          "Wong Tai Sin": { lat: 22.3417, lng: 114.1936 },
          "Kwun Tong": { lat: 22.3133, lng: 114.225 },
          "Kwai Tsing": { lat: 22.36, lng: 114.1 },
          "Tsuen Wan": { lat: 22.3736, lng: 114.1111 },
          "Tuen Mun": { lat: 22.3917, lng: 113.9767 },
          "Yuen Long": { lat: 22.445, lng: 114.022 },
          "North District": { lat: 22.5, lng: 114.1333 },
          "Tai Po": { lat: 22.45, lng: 114.1667 },
          "Sha Tin": { lat: 22.3836, lng: 114.1933 },
          "Sai Kung": { lat: 22.3833, lng: 114.2667 },
          "Islands District": { lat: 22.2611, lng: 113.9461 },
        }
      : {
          "中西區": { lat: 22.2869, lng: 114.154 },
          "灣仔": { lat: 22.2797, lng: 114.1717 },
          "東區": { lat: 22.2806, lng: 114.2222 },
          "南區": { lat: 22.2475, lng: 114.1586 },
          "油尖旺": { lat: 22.3193, lng: 114.1694 },
          "深水埗": { lat: 22.33, lng: 114.1622 },
          "九龍城": { lat: 22.3282, lng: 114.1916 },
          "黃大仙": { lat: 22.3417, lng: 114.1936 },
          "觀塘": { lat: 22.3133, lng: 114.225 },
          "葵青": { lat: 22.36, lng: 114.1 },
          "荃灣": { lat: 22.3736, lng: 114.1111 },
          "屯門": { lat: 22.3917, lng: 113.9767 },
          "元朗": { lat: 22.445, lng: 114.022 },
          "北區": { lat: 22.5, lng: 114.1333 },
          "大埔": { lat: 22.45, lng: 114.1667 },
          "沙田": { lat: 22.3836, lng: 114.1933 },
          "西貢": { lat: 22.3833, lng: 114.2667 },
          "離島區": { lat: 22.2611, lng: 113.9461 },
        };

  let nearestDistrictKey: string | null = null;
  let nearestDist = Infinity;
  for (const [k, c] of Object.entries(districtCenters)) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < nearestDist) {
      nearestDist = d;
      nearestDistrictKey = k;
    }
  }
  if (!nearestDistrictKey) return undefined;

  const mapped = rainfallDistrictKeysByLang[lang][nearestDistrictKey] ?? nearestDistrictKey;
  const item =
    list.find((x) => x.place === mapped) ??
    list.find((x) => x.place === nearestDistrictKey) ??
    list.find((x) => x.main === "TRUE") ??
    list[0];
  return { district: item.place, max: item.max, min: item.min, unit: item.unit, startTime, endTime };
}

router.get("/weather/nearby", async (req, res): Promise<void> => {
  const parsed = Query.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { lat, lng, lang } = parsed.data;
  if (!isFiniteNum(lat) || !isFiniteNum(lng)) {
    res.status(400).json({ error: "Invalid lat/lng" });
    return;
  }

  try {
    const raw = await fetchRhrread(lang);
    const warnsum = await fetchWarnsum(lang);
    const temps = raw.temperature?.data ?? [];
    const recordTime = raw.temperature?.recordTime ?? raw.updateTime ?? new Date().toISOString();
    const temperature = pickNearestTemperature(lat, lng, lang, temps, recordTime);
    const humidity = pickHumidity(raw.humidity, lang);
    const rainfall = pickRainfallByNearestDistrict(lat, lng, lang, raw.rainfall);
    const warnings = extractActiveWarnings(warnsum);

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
  } catch (err) {
    logger.warn({ err }, "HKO fetch failed");
    res.status(502).json({ error: "HKO fetch failed" });
  }
});

export default router;
