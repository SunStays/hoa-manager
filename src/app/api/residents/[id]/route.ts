import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const residentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  role: z.enum(["resident", "board", "admin"]),
  unitIds: z.array(z.string()).default([]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = residentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  const data = parsed.data;

  const user = await db.user.findFirst({
    where: { id, communityId: session.user.communityId },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.email !== user.email) {
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      role: data.role,
      units: { set: data.unitIds.map((uid) => ({ id: uid })) },
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

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await db.user.findFirst({
    where: { id, communityId: session.user.communityId },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
