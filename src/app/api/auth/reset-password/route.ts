import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record) return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
  if (record.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { token } });
    return NextResponse.json({ error: "This link has expired. Please request a new one." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.user.update({ where: { email: record.email }, data: { password: hashed } });
  await db.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
