import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const votes = await db.vote.findMany({
    where: { communityId: session.user.communityId },
    include: {
      responses: {
        include: {
          user: { select: { id: true, name: true } },
          unit: { select: { id: true, unitNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(votes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "board" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only board members can create votes." }, { status: 403 });
  }

  const body = await req.json();
  const { question, description, options, closesAt } = body;

  if (!question || !options || options.length < 2 || !closesAt) {
    return NextResponse.json({ error: "Question, at least 2 options, and a closing date are required." }, { status: 400 });
  }

  const vote = await db.vote.create({
    data: {
      question,
      description: description || null,
      options,
      closesAt: new Date(closesAt),
      communityId: session.user.communityId,
    },
    include: { responses: true },
  });

  return NextResponse.json(vote, { status: 201 });
}
