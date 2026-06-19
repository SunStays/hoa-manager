import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await db.document.findUnique({
    where: { id, communityId: session.user.communityId },
    select: { title: true, fileUrl: true, mimeType: true },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const upstream = await fetch(doc.fileUrl);
  if (!upstream.ok) return NextResponse.json({ error: "File unavailable" }, { status: 502 });

  const ext = doc.fileUrl.split(".").pop()?.split("?")[0] ?? "";
  const filename = `${doc.title}${ext ? `.${ext}` : ""}`;

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": doc.mimeType ?? upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
