import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";

// 為了確保在任何 workspace 下執行都能讀到同一個資料庫，使用絕對路徑指向專案根目錄的 sqlite.db
const dbPath = path.resolve(__dirname, "../../../sqlite.db");
const client = createClient({ url: `file:${dbPath}` });
export const db = drizzle(client, { schema });

export * from "./schema";
