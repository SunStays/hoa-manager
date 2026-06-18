import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendAnnouncementEmails } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const community = await db.community.findUnique({
    where: { id: session.user.communityId },
    select: { name: true },
  });

  await sendAnnouncementEmails({
    communityName: community?.name ?? "HOA Manager",
    authorName: session.user.name ?? "Board",
    title: `[TEST] ${parsed.data.title}`,
    body: parsed.data.body,
    recipients: [{ name: session.user.name ?? "Admin", email: session.user.email! }],
  });

  return NextResponse.json({ success: true });
}
