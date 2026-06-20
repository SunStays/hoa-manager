"use client";

import { useEffect, useState } from "react";

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    }).catch(() => {});
  }, []);

  async function toggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setSubscribed(false);
        setPermission(Notification.permission);
      } else {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        setSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  if (permission === "denied") {
    return (
      <p className="text-xs text-muted-foreground px-3 py-2">
        🔔 Notifications blocked in browser settings
      </p>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground w-full transition-colors disabled:opacity-50"
    >
      <span className="text-base">{subscribed ? "🔔" : "🔕"}</span>
      {loading ? "..." : subscribed ? "Notifications on" : "Enable notifications"}
    </button>
  );
}
