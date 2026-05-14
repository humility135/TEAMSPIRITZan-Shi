import { db } from "../src/index";
import { sql } from "drizzle-orm";

async function checkMatches() {
  const matches = await db.run(sql`SELECT id, venue_id, venue_address FROM public_matches LIMIT 5;`);
  console.log(JSON.stringify(matches, null, 2));
  process.exit(0);
}

checkMatches();
