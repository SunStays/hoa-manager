import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current, next } = await req.json();
  if (!current || !next) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  if (next.length < 6) return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return NextResponse.json({ error: "No password set." }, { status: 400 });

  const match = await bcrypt.compare(current, user.password);
  if (!match) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  const hashed = await bcrypt.hash(next, 12);
  await db.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
