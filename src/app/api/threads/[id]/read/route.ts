import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark messages from the other party as read
  const senderFilter = isBoard
    ? { senderId: thread.residentId }
    : { NOT: { senderId: session.user.id } };

  await db.directMessage.updateMany({
    where: { threadId: id, readAt: null, ...senderFilter },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
