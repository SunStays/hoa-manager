import webpush from "web-push";
import { db } from "./db";

webpush.setVapidDetails(
  "mailto:pietercvisser@gmail.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToCommunity(communityId: string, title: string, body: string) {
  const users = await db.user.findMany({
    where: { communityId },
    include: { pushSubscriptions: true },
  });

  const subscriptions = users.flatMap((u) => u.pushSubscriptions);
  const payload = JSON.stringify({ title, body });

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      })
    )
  );
}
