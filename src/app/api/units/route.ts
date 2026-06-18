import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const unitSchema = z.object({
  unitNumber: z.string().min(1),
  address: z.string().optional(),
  floor: z.coerce.number().optional(),
  sqm: z.coerce.number().optional(),
  monthlyDues: z.coerce.number().min(0),
  status: z.enum(["occupied", "vacant"]),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const units = await db.unit.findMany({
    where: { communityId: session.user.communityId },
    include: {
      residents: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { unitNumber: "asc" },
  });

  return NextResponse.json(units);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = unitSchema.parse(body);

  const existing = await db.unit.findUnique({
    where: { communityId_unitNumber: { communityId: session.user.communityId, unitNumber: data.unitNumber } },
  });
  if (existing) {
    return NextResponse.json({ error: "Unit number already exists." }, { status: 409 });
  }

  const unit = await db.unit.create({
    data: { ...data, communityId: session.user.communityId },
  });

  return NextResponse.json(unit, { status: 201 });
}
