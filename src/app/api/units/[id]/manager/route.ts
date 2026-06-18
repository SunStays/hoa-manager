import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { pmName, pmPhone, pmEmail } = await req.json();

  const unit = await db.unit.findFirst({ where: { id, communityId: session.user.communityId } });
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.unit.update({
    where: { id },
    data: {
      pmName: pmName || null,
      pmPhone: pmPhone || null,
      pmEmail: pmEmail || null,
    },
  });

  return NextResponse.json(updated);
}
