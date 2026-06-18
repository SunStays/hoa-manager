import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";
import { sendAnnouncementEmails } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const files = formData.getAll("files") as File[];

  if (!title || !body) return NextResponse.json({ error: "Fill in subject and message first." }, { status: 400 });

  const attachmentUrls: string[] = [];
  for (const file of files) {
    if (file.size > 0) {
      const blob = await put(`hoa/${session.user.communityId}/announcements/${Date.now()}-${file.name}`, file, { access: "public" });
      attachmentUrls.push(blob.url);
    }
  }

  const community = await db.community.findUnique({
    where: { id: session.user.communityId },
    select: { name: true },
  });

  await sendAnnouncementEmails({
    communityName: community?.name ?? "HOA Manager",
    authorName: session.user.name ?? "Board",
    title: `[TEST] ${title}`,
    body,
    recipients: [{ name: session.user.name ?? "Admin", email: session.user.email! }],
    attachmentUrls,
  });

  return NextResponse.json({ success: true });
}
