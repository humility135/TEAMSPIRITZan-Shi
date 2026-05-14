import { db } from "../src/index";
import { venuesTable } from "../src/schema/venues";

async function debug() {
  const venues = await db.select().from(venuesTable).limit(5);
  console.log(JSON.stringify(venues, null, 2));
  process.exit(0);
}

debug();
