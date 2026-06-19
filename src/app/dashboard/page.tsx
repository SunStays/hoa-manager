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

export default function DashboardPage() {
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [unitCount, setUnitCount] = useState<number | null>(null);
  const [residentCount, setResidentCount] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

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
  }, []);

  const loading = unitCount === null;

  const stats = [
    { label: "Total Units", value: unitCount, icon: "🏠", color: "bg-blue-50 text-blue-700", href: "/dashboard/units" },
    { label: "Residents", value: residentCount, icon: "👥", color: "bg-green-50 text-green-700", href: "/dashboard/residents" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {communityName ?? "Dashboard"}
        </h1>
        <p className="text-gray-500 mt-1">Welcome to HOA Manager</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? "—" : stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Announcements</h2>
        {announcements === null ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-gray-400">No announcements yet.</p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                {a.pinned && <span className="text-xs mt-0.5">📌</span>}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">
                    {a.author.name} · {new Date(a.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/announcements" className="mt-4 block text-xs font-medium text-blue-600 hover:underline">
          View all →
        </Link>
      </div>
    </div>
  );
}
