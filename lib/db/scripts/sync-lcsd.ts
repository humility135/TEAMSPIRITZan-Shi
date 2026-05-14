import { db } from "../src/index";
import { venuesTable } from "../src/schema/venues";
import crypto from "crypto";

const LCSD_SOURCES = [
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-sp11atp.json",
    surface: "turf",
    description: "11人仿真草"
  },
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-sp7atp.json",
    surface: "turf",
    description: "7人仿真草"
  },
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-sp11ntp.json",
    surface: "grass",
    description: "11人真草"
  },
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-hssp5.json",
    surface: "hard",
    description: "5人硬地"
  },
  {
    url: "https://www.lcsd.gov.hk/datagovhk/facility/facility-hssp7.json",
    surface: "hard",
    description: "7人硬地"
  }
];

function generateId(name: string, address: string) {
  return crypto.createHash("md5").update(`${name}-${address}`).digest("hex");
}

function parseCoord(val: any): number {
  if (typeof val === "number") return val;
  if (!val || typeof val !== "string") return 0;
  // Handle format like "114-10-19" or "22.1234"
  if (val.includes("-")) {
    const parts = val.split("-").map(Number);
    if (parts.length === 3) {
      return parts[0] + parts[1] / 60 + parts[2] / 3600;
    }
    if (parts.length === 2) {
      return parts[0] + parts[1] / 60;
    }
  }
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}

async function sync() {
  console.log("🚀 Starting LCSD Soccer Pitches Sync...");
  
  // Clear existing venues to avoid duplicates and mixed languages
  console.log("🧹 Clearing existing venues...");
  await db.delete(venuesTable);
  
  for (const source of LCSD_SOURCES) {
    try {
      console.log(`📡 Fetching ${source.description} from ${source.url}...`);
      const response = await fetch(source.url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log(`✅ Received ${data.length} items.`);

      for (const item of data) {
        const name = item.Name_tc || item.Name_cn || item.Name_en || "";
        const nameEn = item.Name_en || "";
        const address = item.Address_tc || item.Address_cn || item.Address_en || "";
        const addressEn = item.Address_en || "";
        let district = item.District_tc || item.District_cn || item.District_en || "";
        const districtEn = item.District_en || "";
        
        // Normalize district
        if (district) {
          district = district.trim();
          if (district === '油尖旺') district = '油尖旺區';
          if (district === '深水埗') district = '深水埗區';
          if (district === '九龍城') district = '九龍城區';
          if (district === '黃大仙') district = '黃大仙區';
          if (district.length <= 3 && !district.endsWith('區')) {
            district = district + '區';
          }
        } else {
          district = '其他';
        }

        const lat = parseCoord(item.Latitude);
        const lng = parseCoord(item.Longitude);

        if (!name || !lat || !lng) continue;

        const id = generateId(name, address);

        await db.insert(venuesTable).values({
          id,
          name,
          nameEn,
          address,
          addressEn,
          district,
          districtEn,
          lat,
          lng,
          surface: source.surface as any,
          weather: { temp: 20, condition: "Sunny", lightningWarning: false }
        }).onConflictDoUpdate({
          target: venuesTable.id,
          set: {
            name,
            nameEn,
            address,
            addressEn,
            district,
            districtEn,
            lat,
            lng,
            surface: source.surface as any
          }
        });
      }
      console.log(`✨ Finished syncing ${source.description}`);
    } catch (error) {
      console.error(`❌ Error syncing ${source.description}:`, error);
    }
  }

  console.log("🏁 All sync tasks completed!");
  process.exit(0);
}

sync();
