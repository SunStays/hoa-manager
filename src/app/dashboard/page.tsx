"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Announcement = {
  id: string;
  title: string;
  pinned: boolean;
  publishedAt: string;
  author: { name: string };
};

type OnlineUser = { id: string; name: string; role: string };

const roleLabel: Record<string, string> = { admin: "Admin", board: "Board", resident: "Resident" };

export default function DashboardPage() {
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [unitCount, setUnitCount] = useState<number | null>(null);
  const [residentCount, setResidentCount] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [online, setOnline] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const safe = (p: Promise<Response>) =>
      p.then((r) => (r.ok ? r.json().catch(() => null) : null)).catch(() => null);

    Promise.all([
      safe(fetch("/api/community")),
      safe(fetch("/api/units")),
      safe(fetch("/api/residents")),
      safe(fetch("/api/announcements")),
    ]).then(([community, units, residents, ann]) => {
      setCommunityName(community?.name ?? null);
      setUnitCount(Array.isArray(units) ? units.length : 0);
      setResidentCount(Array.isArray(residents) ? residents.length : 0);
      setAnnouncements(Array.isArray(ann) ? ann.slice(0, 5) : []);
    });

    function refreshPresence() {
      fetch("/api/presence")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setOnline(Array.isArray(data) ? data : []));
    }

    // Fire heartbeat first, then immediately refresh presence so the current
    // user is already in the list on the first render.
    fetch("/api/me/heartbeat", { method: "POST" }).then(refreshPresence);
    const interval = setInterval(refreshPresence, 30_000);
    return () => clearInterval(interval);
  }, []);

  const loading = unitCount === null;

  const stats = [
    { label: "Total Units", value: unitCount, icon: "🏠", color: "bg-accent text-primary", href: "/dashboard/units" },
    { label: "Residents", value: residentCount, icon: "👥", color: "bg-green-500/20 text-green-400", href: "/dashboard/residents" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {communityName ?? "Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-1">Welcome to HOA Manager</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-card rounded-xl border border-border p-5 hover:border-border transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {loading ? "—" : stat.value}
            </p>
          </Link>
        ))}
      </div>

      {online.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="font-semibold text-foreground">Online now</h2>
            <span className="text-xs text-muted-foreground">({online.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {online.map((u) => (
              <div key={u.id} className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-sm text-foreground font-medium">{u.name}</span>
                <span className="text-xs text-muted-foreground">{roleLabel[u.role] ?? u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-4">Recent Announcements</h2>
        {announcements === null ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                {a.pinned && <span className="text-xs mt-0.5">📌</span>}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.author.name} · {new Date(a.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/announcements" className="mt-4 block text-xs font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>
    </div>
  );
}
