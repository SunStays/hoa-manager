import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const hashed = await bcrypt.hash("HOA2026!", 12);
  await db.user.update({
    where: { email: "pietercvisser@gmail.com" },
    data: { password: hashed },
  });
  return NextResponse.json({ ok: true });
}
