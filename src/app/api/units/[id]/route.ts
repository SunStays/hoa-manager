import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const unitSchema = z.object({
  unitNumber: z.string().min(1),
  address: z.string().optional(),
  floor: z.coerce.number().optional().nullable(),
  sqm: z.coerce.number().optional().nullable(),
  monthlyDues: z.coerce.number().min(0),
  status: z.enum(["occupied", "vacant"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data = unitSchema.parse(body);

  const unit = await db.unit.findFirst({
    where: { id, communityId: session.user.communityId },
  });
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.unit.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const unit = await db.unit.findFirst({
    where: { id, communityId: session.user.communityId },
  });
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.unit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
