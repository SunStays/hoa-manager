import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendAnnouncementEmails } from "@/lib/email";

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  pinned: z.boolean().default(false),
});

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

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const announcement = await db.announcement.create({
    data: {
      ...parsed.data,
      communityId: session.user.communityId,
      authorId: session.user.id,
    },
    include: { author: { select: { name: true, role: true } } },
  });

  // Send email to all residents in the community
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
      title: parsed.data.title,
      body: parsed.data.body,
      recipients: residents,
    }).catch(console.error);
  }

  return NextResponse.json(announcement, { status: 201 });
}
