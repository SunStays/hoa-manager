import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isBoard = session.user.role === "board" || session.user.role === "admin";

  if (isBoard) {
    const threads = await db.thread.findMany({
      where: { communityId: session.user.communityId },
      include: {
        resident: { select: { id: true, name: true, role: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, body: true, senderId: true, createdAt: true, readAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Count unread messages per thread (messages from resident not yet read)
    const threadsWithUnread = await Promise.all(
      threads.map(async (t) => {
        const unread = await db.directMessage.count({
          where: {
            threadId: t.id,
            senderId: t.residentId,
            readAt: null,
          },
        });
        return { ...t, unreadCount: unread };
      })
    );

    // Sort: threads with unread first, then by latest message
    threadsWithUnread.sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      const aTime = a.messages[0]?.createdAt ?? a.createdAt;
      const bTime = b.messages[0]?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json(threadsWithUnread);
  } else {
    const thread = await db.thread.findFirst({
      where: { residentId: session.user.id, communityId: session.user.communityId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    return NextResponse.json(thread ?? null);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isBoard = session.user.role === "board" || session.user.role === "admin";

  let residentId: string;
  if (isBoard) {
    const body = await req.json();
    residentId = body.residentId;
    if (!residentId) return NextResponse.json({ error: "residentId required" }, { status: 400 });

    // Verify user belongs to same community and isn't the current user
    if (residentId === session.user.id) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    const resident = await db.user.findFirst({
      where: { id: residentId, communityId: session.user.communityId },
    });
    if (!resident) return NextResponse.json({ error: "User not found" }, { status: 404 });
  } else {
    residentId = session.user.id;
  }

  const thread = await db.thread.upsert({
    where: { residentId },
    create: { communityId: session.user.communityId, residentId },
    update: {},
    include: {
      resident: { select: { id: true, name: true, role: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  return NextResponse.json(thread);
}
