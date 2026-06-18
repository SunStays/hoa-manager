import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const community = await db.community.findFirst();
  if (!community) throw new Error("No community found. Register first.");
  console.log(`Community: ${community.name} (${community.id})`);

  const units = [
    // Ground floor: units 1-7, 1700 sqft
    ...Array.from({ length: 7 }, (_, i) => ({
      unitNumber: String(i + 1),
      address: "LG Smith Blvd 283-P",
      floor: 0,
      sqm: 1700,
      monthlyDues: 1000,
      status: "occupied",
      communityId: community.id,
    })),
    // First floor: units 8-14, 1450 sqft
    ...Array.from({ length: 7 }, (_, i) => ({
      unitNumber: String(i + 8),
      address: "LG Smith Blvd 283-P",
      floor: 1,
      sqm: 1450,
      monthlyDues: 1000,
      status: "occupied",
      communityId: community.id,
    })),
  ];

  let created = 0;
  for (const unit of units) {
    const existing = await db.unit.findUnique({
      where: { communityId_unitNumber: { communityId: community.id, unitNumber: unit.unitNumber } },
    });
    if (existing) {
      console.log(`  Unit #${unit.unitNumber} already exists, skipping.`);
      continue;
    }
    await db.unit.create({ data: unit });
    console.log(`  Created unit #${unit.unitNumber}`);
    created++;
  }

  console.log(`\nDone! Created ${created} units.`);
}

main().catch(console.error).finally(() => db.$disconnect());
