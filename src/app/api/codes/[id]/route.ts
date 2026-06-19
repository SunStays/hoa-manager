import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { label, value, category, note } = await req.json();

  const code = await db.importantCode.update({
    where: { id, communityId: session.user.communityId },
    data: { label, value, category, note: note || null },
  });

  return NextResponse.json(code);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.importantCode.delete({ where: { id, communityId: session.user.communityId } });

  return NextResponse.json({ ok: true });
}
