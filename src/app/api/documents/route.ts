import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await db.document.findMany({
    where: { communityId: session.user.communityId },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const yearRaw = formData.get("year") as string | null;
  const year = yearRaw ? parseInt(yearRaw) : null;

  if (!file || !title || !category) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const blob = await put(`hoa/${session.user.communityId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const doc = await db.document.create({
    data: {
      communityId: session.user.communityId,
      uploadedById: session.user.id,
      title,
      category,
      year,
      fileUrl: blob.url,
      fileSize: file.size,
      mimeType: file.type,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(doc, { status: 201 });
}
