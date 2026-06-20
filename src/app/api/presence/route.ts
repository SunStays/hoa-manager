import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes

  const users = await db.user.findMany({
    where: {
      communityId: session.user.communityId,
      lastSeenAt: { gte: since },
    },
    select: { id: true, name: true, role: true },
    orderBy: { lastSeenAt: "desc" },
  });

  return NextResponse.json(users);
}
