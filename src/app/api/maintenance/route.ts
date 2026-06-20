import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";

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

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const unitId = formData.get("unitId") as string;
  const priority = (formData.get("priority") as string) || "medium";
  const files = formData.getAll("photos") as File[];

  if (!title || !description || !unitId) {
    return NextResponse.json({ error: "Title, description, and unit are required." }, { status: 400 });
  }

  const photoUrls = await Promise.all(
    files.filter((f) => f.size > 0).map((f) =>
      put(`hoa/${session.user.communityId}/maintenance/${Date.now()}-${f.name}`, f, { access: "public" }).then((b) => b.url)
    )
  );

  const request = await db.maintenanceRequest.create({
    data: {
      communityId: session.user.communityId,
      submittedById: session.user.id,
      unitId,
      title,
      description,
      priority,
      photos: photoUrls,
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
