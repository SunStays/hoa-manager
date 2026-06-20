"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
          <p className="text-muted-foreground mt-1 text-sm">We will send you a reset link by email</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📬</div>
            <p className="text-foreground font-medium">Check your email!</p>
            <p className="text-muted-foreground text-sm">We sent a reset link to <strong>{email}</strong>. Tap the link in the email to choose a new password.</p>
            <p className="text-muted-foreground text-xs mt-2">Did not receive it? Check your spam folder.</p>
            <Link href="/login" className="block mt-4 text-primary text-sm hover:underline">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Your email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/20 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
