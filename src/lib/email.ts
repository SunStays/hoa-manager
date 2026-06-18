import { Resend } from "resend";

export async function sendAnnouncementEmails({
  communityName,
  authorName,
  title,
  body,
  recipients,
  attachmentUrls = [],
}: {
  communityName: string;
  authorName: string;
  title: string;
  body: string;
  recipients: { name: string; email: string }[];
  attachmentUrls?: string[];
}) {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return;

  const resend = new Resend(process.env.RESEND_API_KEY);

  const attachmentListHtml = attachmentUrls.length > 0
    ? `<div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #374151;">📎 Attachments (${attachmentUrls.length})</p>
        ${attachmentUrls.map((url) => {
          const name = decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "file").replace(/^\d+-/, "");
          return `<a href="${url}" style="display: block; color: #2563eb; font-size: 13px; margin-top: 4px; text-decoration: none;">📄 ${name}</a>`;
        }).join("")}
      </div>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #2563eb; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">📢 ${communityName}</h1>
        <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 13px;">Board Announcement</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #111827; margin: 0 0 16px; font-size: 18px;">${title}</h2>
        <div style="color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${body}</div>
        ${attachmentListHtml}
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">
          Posted by <strong>${authorName}</strong> · ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  `;

  const attachments = attachmentUrls.map((url) => ({
    path: url,
    filename: decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "file").replace(/^\d+-/, ""),
  }));

  await resend.emails.send({
    from: `${communityName} <onboarding@resend.dev>`,
    to: recipients.map((r) => r.email),
    subject: `📢 ${title}`,
    html,
    attachments,
  });
}
