import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  communityName: z.string().min(2),
  communityAddress: z.string().min(2),
  communityCity: z.string().min(2),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email: data.adminEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    const community = await db.community.create({
      data: {
        name: data.communityName,
        address: data.communityAddress,
        city: data.communityCity,
        users: {
          create: {
            name: data.adminName,
            email: data.adminEmail,
            password: hashedPassword,
            role: "admin",
          },
        },
      },
    });

    return NextResponse.json({ success: true, communityId: community.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
