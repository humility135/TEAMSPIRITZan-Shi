import { db } from "../src/index";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Adding name_en...");
    await db.run(sql`ALTER TABLE venues ADD COLUMN name_en TEXT;`);
    console.log("Adding district_en...");
    await db.run(sql`ALTER TABLE venues ADD COLUMN district_en TEXT;`);
    console.log("Adding address_en...");
    await db.run(sql`ALTER TABLE venues ADD COLUMN address_en TEXT;`);
    console.log("Success!");
  } catch (e) {
    console.log("Column might already exist or error:", e.message);
  }
  process.exit(0);
}

migrate();
