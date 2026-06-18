import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const residentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["resident", "board", "admin"]),
  unitId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const residents = await db.user.findMany({
    where: { communityId: session.user.communityId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      unitId: true,
      createdAt: true,
      unit: { select: { id: true, unitNumber: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(residents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = residentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  if (data.unitId) {
    const unit = await db.unit.findFirst({
      where: { id: data.unitId, communityId: session.user.communityId },
    });
    if (!unit) return NextResponse.json({ error: "Unit not found." }, { status: 404 });
  }

  const resident = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      role: data.role,
      unitId: data.unitId ?? null,
      communityId: session.user.communityId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      unitId: true,
      createdAt: true,
      unit: { select: { id: true, unitNumber: true } },
    },
  });

  return NextResponse.json(resident, { status: 201 });
}
