import { db, venuesTable } from "../src/index";

async function main() {
  const venues = await db.select().from(venuesTable).limit(20);
  if (venues.length === 0) {
    console.error("venues is empty");
    process.exitCode = 1;
    return;
  }

  const samples = venues.slice(0, 5).map((v) => ({
    id: v.id,
    name: v.name,
    nameEn: v.nameEn,
    district: v.district,
    districtEn: v.districtEn,
    address: v.address,
    addressEn: v.addressEn,
  }));

  console.log(JSON.stringify({ count: venues.length, samples }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
