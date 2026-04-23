import { defineConfig } from "drizzle-kit";
import path from "path";

// Use an absolute path to ensure all tools and servers use the exact same SQLite file
const dbPath = "/workspace/local.db";
const dbUrl = process.env.DATABASE_URL || `file:${dbPath}`;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./drizzle"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
});