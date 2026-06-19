import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "board" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, notes } = await req.json();

  const request = await db.maintenanceRequest.update({
    where: { id, communityId: session.user.communityId },
    data: {
      ...(status ? { status, ...(status === "resolved" ? { resolvedAt: new Date() } : {}) } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return NextResponse.json(request);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "board" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.maintenanceRequest.delete({ where: { id, communityId: session.user.communityId } });

  return NextResponse.json({ ok: true });
}
