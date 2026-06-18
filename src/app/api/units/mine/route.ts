import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const units = await db.unit.findMany({
    where: {
      communityId: session.user.communityId,
      residents: { some: { id: session.user.id } },
    },
    select: { id: true, unitNumber: true },
    orderBy: { unitNumber: "asc" },
  });

  return NextResponse.json(units);
}
