import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isBoard = session.user.role === "board" || session.user.role === "admin";

  if (isBoard) {
    // Count threads that have at least one unread message from a resident
    const threads = await db.thread.findMany({
      where: { communityId: session.user.communityId },
      select: { id: true, residentId: true },
    });
    let count = 0;
    for (const t of threads) {
      const unread = await db.directMessage.count({
        where: { threadId: t.id, senderId: t.residentId, readAt: null },
      });
      if (unread > 0) count++;
    }
    return NextResponse.json({ count });
  } else {
    const thread = await db.thread.findFirst({
      where: { residentId: session.user.id, communityId: session.user.communityId },
      select: { id: true },
    });
    if (!thread) return NextResponse.json({ count: 0 });

    const count = await db.directMessage.count({
      where: { threadId: thread.id, readAt: null, NOT: { senderId: session.user.id } },
    });
    return NextResponse.json({ count });
  }
}
