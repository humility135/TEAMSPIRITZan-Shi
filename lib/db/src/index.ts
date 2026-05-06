import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from "url";

// 為了確保在任何 workspace 下執行都能讀到同一個資料庫，使用絕對路徑指向專案根目錄的 sqlite.db
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../../../sqlite.db");
const client = createClient({ url: `file:${dbPath}` });
export const db = drizzle(client, { schema });

export * from "./schema";
