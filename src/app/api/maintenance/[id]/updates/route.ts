import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "board" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { message, status } = await req.json();
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const request = await db.maintenanceRequest.findFirst({
    where: { id, communityId: session.user.communityId },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [update] = await db.$transaction([
    db.maintenanceUpdate.create({
      data: {
        requestId: id,
        authorId: session.user.id,
        message,
        status: status || null,
      },
      include: { author: { select: { name: true, role: true } } },
    }),
    ...(status
      ? [db.maintenanceRequest.update({
          where: { id },
          data: { status, ...(status === "resolved" ? { resolvedAt: new Date() } : {}) },
        })]
      : []),
  ]);

  return NextResponse.json(update, { status: 201 });
}
