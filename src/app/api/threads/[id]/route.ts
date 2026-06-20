import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isBoard = session.user.role === "board" || session.user.role === "admin";

  const thread = await db.thread.findFirst({
    where: {
      id,
      communityId: session.user.communityId,
      ...(isBoard ? {} : { residentId: session.user.id }),
    },
    include: {
      resident: { select: { id: true, name: true, role: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(thread);
}
