"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next !== confirm) { setError("New passwords do not match."); return; }
    if (next.length < 6) { setError("New password must be at least 6 characters."); return; }

    setSaving(true);
    const res = await fetch("/api/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error || "Something went wrong."); return; }

    setSuccess(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage your account settings</p>

      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-foreground mb-1">Change password</h2>
        <p className="text-muted-foreground text-sm mb-6">Choose a new password for your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Current password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-green-400 text-sm bg-green-500/20 px-3 py-2 rounded-lg">✅ Password changed successfully!</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
