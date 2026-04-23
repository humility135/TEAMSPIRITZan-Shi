import { defineConfig } from "drizzle-kit";
import path from "path";

// Ensure we always use the exact same file regardless of where the script is executed from
const dbPath = path.resolve(__dirname, "../local.db");
const dbUrl = process.env.DATABASE_URL || `file:${dbPath}`;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./drizzle"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
});