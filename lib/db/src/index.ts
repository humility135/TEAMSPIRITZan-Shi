import { drizzle } from "drizzle-orm/libsql";
export { sql } from "drizzle-orm";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// 為了確保在任何 workspace 下執行都能讀到同一個資料庫，從目前路徑向上尋找 sqlite.db
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findDbPath() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.replace(/^file:/, "");
  
  let currentDir = __dirname;
  // 向上尋找最多 6 層
  for (let i = 0; i < 6; i++) {
    const potentialPath = path.join(currentDir, "sqlite.db");
    if (fs.existsSync(potentialPath)) {
      return potentialPath;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  // 備用方案
  return path.resolve(__dirname, "../../../sqlite.db");
}

const dbPath = findDbPath();
console.log(`[DB] Resolved database path: ${dbPath}`);
const client = createClient({ url: `file:${dbPath}` });
export const db = drizzle(client, { schema });

export * from "./schema";
