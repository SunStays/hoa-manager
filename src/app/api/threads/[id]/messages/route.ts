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

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });

  const message = await db.directMessage.create({
    data: { threadId: id, senderId: session.user.id, body: body.trim() },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(message);
}
