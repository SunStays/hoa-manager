"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    communityName: "",
    communityAddress: "",
    communityCity: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Register your HOA</h1>
          <p className="text-muted-foreground mt-1 text-sm">Set up your community in 2 minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* HOA Details */}
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
              Community details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  HOA / Community name
                </label>
                <input
                  type="text"
                  value={form.communityName}
                  onChange={(e) => update("communityName", e.target.value)}
                  required
                  placeholder="e.g. Sunset Gardens HOA"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={form.communityAddress}
                  onChange={(e) => update("communityAddress", e.target.value)}
                  required
                  placeholder="e.g. Palm Beach Road 12"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.communityCity}
                  onChange={(e) => update("communityCity", e.target.value)}
                  required
                  placeholder="e.g. Oranjestad"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
              Your admin account
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={form.adminName}
                  onChange={(e) => update("adminName", e.target.value)}
                  required
                  placeholder="e.g. Pieter Visser"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => update("adminEmail", e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={form.adminPassword}
                  onChange={(e) => update("adminPassword", e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating your HOA..." : "Create HOA & Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
