import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isBoard = session.user.role === "board" || session.user.role === "admin";

  const requests = await db.maintenanceRequest.findMany({
    where: {
      communityId: session.user.communityId,
      ...(isBoard ? {} : { submittedById: session.user.id }),
    },
    include: {
      unit: { select: { unitNumber: true } },
      submittedBy: { select: { name: true } },
      updates: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      announcements: {
        select: { id: true, title: true, body: true, publishedAt: true, author: { select: { name: true } } },
        orderBy: { publishedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, unitId, priority } = await req.json();
  if (!title || !description || !unitId) {
    return NextResponse.json({ error: "Title, description, and unit are required." }, { status: 400 });
  }

  const request = await db.maintenanceRequest.create({
    data: {
      communityId: session.user.communityId,
      submittedById: session.user.id,
      unitId,
      title,
      description,
      priority: priority || "medium",
    },
    include: {
      unit: { select: { unitNumber: true } },
      submittedBy: { select: { name: true } },
      updates: true,
      announcements: true,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
