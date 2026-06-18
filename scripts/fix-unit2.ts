import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const community = await db.community.findFirst();
  if (!community) throw new Error("No community found.");

  const unit = await db.unit.findUnique({
    where: { communityId_unitNumber: { communityId: community.id, unitNumber: "2" } },
  });
  if (!unit) { console.log("Unit #2 not found."); return; }

  await db.unit.update({
    where: { id: unit.id },
    data: { address: "LG Smith Blvd 283-P", floor: 0, sqm: 1700, monthlyDues: 1000, status: "occupied" },
  });
  console.log("Unit #2 updated.");
}

main().catch(console.error).finally(() => db.$disconnect());
