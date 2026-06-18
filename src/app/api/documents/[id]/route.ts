import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { del } from "@vercel/blob";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await db.document.findFirst({
    where: { id, communityId: session.user.communityId },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await del(doc.fileUrl);
  await db.document.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
