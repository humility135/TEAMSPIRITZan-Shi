import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we always use the exact same file regardless of where the script is executed from
const dbPath = path.resolve(__dirname, "../../local.db");
const client = createClient({ url: process.env.DATABASE_URL || `file:${dbPath}` });

export const db = drizzle(client, { schema });
export * from "./schema";