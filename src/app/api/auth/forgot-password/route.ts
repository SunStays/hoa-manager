import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const user = await db.user.findUnique({ where: { email } });

  // Always return success so we don't reveal whether an email exists
  if (!user) return NextResponse.json({ ok: true });

  // Delete any existing tokens for this email
  await db.passwordResetToken.deleteMany({ where: { email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await db.passwordResetToken.create({ data: { email, token, expiresAt } });

  const appUrl = process.env.NEXTAUTH_URL?.replace("http://localhost:3000", "https://hoa-manager-phi.vercel.app") ?? "https://hoa-manager-phi.vercel.app";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "HOA Manager <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #2563eb; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">🔑 HOA Manager</h1>
          </div>
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; margin: 0 0 12px;">Reset your password</h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${user.name},<br/><br/>Tap the button below to choose a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; background: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
              Reset my password
            </a>
            <p style="color: #9ca3af; font-size: 13px;">If you did not request this, you can ignore this email.</p>
          </div>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
