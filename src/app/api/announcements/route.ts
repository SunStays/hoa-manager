import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";
import { sendAnnouncementEmails } from "@/lib/email";
import { sendPushToCommunity } from "@/lib/push";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const announcements = await db.announcement.findMany({
    where: { communityId: session.user.communityId },
    include: { author: { select: { name: true, role: true } } },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
  });

  return NextResponse.json(announcements);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "board" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const pinned = formData.get("pinned") === "true";
  const files = formData.getAll("files") as File[];

  if (!title || !body) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  // Upload attachments to Vercel Blob
  const attachmentUrls: string[] = [];
  for (const file of files) {
    if (file.size > 0) {
      const blob = await put(`hoa/${session.user.communityId}/announcements/${Date.now()}-${file.name}`, file, { access: "public" });
      attachmentUrls.push(blob.url);
    }
  }

  const announcement = await db.announcement.create({
    data: {
      title,
      body,
      pinned,
      attachments: attachmentUrls,
      communityId: session.user.communityId,
      authorId: session.user.id,
    },
    include: { author: { select: { name: true, role: true } } },
  });

  const community = await db.community.findUnique({
    where: { id: session.user.communityId },
    select: { name: true },
  });

  const residents = await db.user.findMany({
    where: { communityId: session.user.communityId, NOT: { id: session.user.id } },
    select: { name: true, email: true },
  });

  if (community && residents.length > 0) {
    await sendAnnouncementEmails({
      communityName: community.name,
      authorName: announcement.author.name,
      title,
      body,
      recipients: residents,
      attachmentUrls,
    }).catch(console.error);
  }

  await sendPushToCommunity(
    session.user.communityId,
    `📣 ${title}`,
    body.length > 100 ? body.slice(0, 97) + "…" : body
  ).catch(console.error);

  return NextResponse.json(announcement, { status: 201 });
}
