import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "board" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only board members can delete votes." }, { status: 403 });
  }

  const { id } = await params;
  await db.vote.delete({ where: { id, communityId: session.user.communityId } });
  return NextResponse.json({ success: true });
}
