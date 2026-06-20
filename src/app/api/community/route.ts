import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await db.community.findUnique({
    where: { id: session.user.communityId },
    select: { id: true, name: true, buildingPmName: true, buildingPmPhone: true, buildingPmEmail: true },
  });

  return NextResponse.json(community);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "board" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { buildingPmName, buildingPmPhone, buildingPmEmail } = await req.json();

  const community = await db.community.update({
    where: { id: session.user.communityId },
    data: {
      buildingPmName: buildingPmName || null,
      buildingPmPhone: buildingPmPhone || null,
      buildingPmEmail: buildingPmEmail || null,
    },
    select: { id: true, buildingPmName: true, buildingPmPhone: true, buildingPmEmail: true },
  });

  return NextResponse.json(community);
}
