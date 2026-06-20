import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const residentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  role: z.enum(["resident", "board", "admin"]),
  unitIds: z.array(z.string()).default([]),
  password: z.string().min(6).optional().nullable(),
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
      createdAt: true,
      units: { select: { id: true, unitNumber: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(residents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "board" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = residentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;

  const resident = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      role: data.role,
      password: hashedPassword,
      communityId: session.user.communityId,
      units: data.unitIds.length > 0 ? { connect: data.unitIds.map((id) => ({ id })) } : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      units: { select: { id: true, unitNumber: true } },
    },
  });

  return NextResponse.json(resident, { status: 201 });
}
