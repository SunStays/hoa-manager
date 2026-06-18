import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: voteId } = await params;
  const { unitId, option } = await req.json();

  if (!unitId || !option) {
    return NextResponse.json({ error: "Unit and option are required." }, { status: 400 });
  }

  // Check vote exists and is still open
  const vote = await db.vote.findUnique({ where: { id: voteId, communityId: session.user.communityId } });
  if (!vote) return NextResponse.json({ error: "Vote not found." }, { status: 404 });
  if (new Date() > vote.closesAt) return NextResponse.json({ error: "This vote is closed." }, { status: 400 });
  if (!vote.options.includes(option)) return NextResponse.json({ error: "Invalid option." }, { status: 400 });

  // Check the unit belongs to this user
  const unit = await db.unit.findFirst({
    where: { id: unitId, communityId: session.user.communityId, residents: { some: { id: session.user.id } } },
  });
  if (!unit) return NextResponse.json({ error: "You don't own this unit." }, { status: 403 });

  // Upsert so re-voting changes the choice
  const response = await db.voteResponse.upsert({
    where: { voteId_unitId: { voteId, unitId } },
    create: { voteId, unitId, userId: session.user.id, option },
    update: { option, userId: session.user.id },
  });

  return NextResponse.json(response);
}
