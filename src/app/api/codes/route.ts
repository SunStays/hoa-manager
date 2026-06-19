import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await db.importantCode.findMany({
    where: { communityId: session.user.communityId },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, value, category, note } = await req.json();
  if (!label || !value) return NextResponse.json({ error: "Label and value are required." }, { status: 400 });

  const code = await db.importantCode.create({
    data: {
      communityId: session.user.communityId,
      label,
      value,
      category: category || "general",
      note: note || null,
    },
  });

  return NextResponse.json(code, { status: 201 });
}
