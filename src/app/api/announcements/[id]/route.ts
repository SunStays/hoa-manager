import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  pinned: z.boolean().default(false),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const existing = await db.announcement.findFirst({
    where: { id, communityId: session.user.communityId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.announcement.update({
    where: { id },
    data: parsed.data,
    include: { author: { select: { name: true, role: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await db.announcement.findFirst({
    where: { id, communityId: session.user.communityId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
