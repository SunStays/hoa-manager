"use client";

import { useEffect, useState } from "react";

type Code = {
  id: string;
  label: string;
  value: string;
  category: string;
  note: string | null;
};

const CATEGORIES = [
  { value: "security", label: "Security" },
  { value: "utilities", label: "Utilities" },
  { value: "emergency", label: "Emergency" },
  { value: "general", label: "General" },
];

const categoryBadge: Record<string, string> = {
  security:  "bg-red-500/20 text-red-700",
  utilities: "bg-accent text-primary",
  emergency: "bg-orange-500/20 text-orange-400",
  general:   "bg-secondary text-muted-foreground",
};

const emptyForm = { label: "", value: "", category: "general", note: "" };

export default function CodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode] = useState<Code | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  async function load() {
    try {
      const res = await fetch("/api/codes");
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditCode(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(c: Code) {
    setEditCode(c);
    setForm({ label: c.label, value: c.value, category: c.category, note: c.note ?? "" });
    setError("");
    setShowModal(true);
  }

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(editCode ? `/api/codes/${editCode.id}` : "/api/codes", {
      method: editCode ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setSaving(false);
      return;
    }

    setShowModal(false);
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/codes/${id}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: codes.filter((c) => c.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Important Codes & Numbers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gate codes, emergency numbers, utilities, and more</p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
      ) : codes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-3xl mb-3">🔑</p>
          <p className="text-muted-foreground text-sm mb-4">No codes or numbers saved yet.</p>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Add your first entry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.value}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{group.label}</h2>
              <div className="space-y-2">
                {group.items.map((c) => (
                  <div key={c.id} className="bg-card rounded-xl border border-border px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{c.label}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryBadge[c.category] ?? "bg-secondary text-muted-foreground"}`}>
                            {CATEGORIES.find((cat) => cat.value === c.category)?.label ?? c.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold text-foreground tracking-widest">
                            {revealed.has(c.id) ? c.value : "•".repeat(Math.min(c.value.length, 8))}
                          </span>
                          <button
                            onClick={() => toggleReveal(c.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            {revealed.has(c.id) ? "Hide" : "Show"}
                          </button>
                        </div>
                        {c.note && <p className="text-xs text-muted-foreground mt-1">{c.note}</p>}
                      </div>
                      <div className="flex gap-3 shrink-0 mt-0.5">
                        <button onClick={() => openEdit(c)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                        <button onClick={() => setDeleteId(c.id)} className="text-xs font-medium text-red-400 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-foreground mb-5">
              {editCode ? "Edit entry" : "Add code or number"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Label *</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  required
                  placeholder="e.g. Gate Code, Pool Alarm"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Code / Number *</label>
                <input
                  type="text"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                  placeholder="e.g. 1234 or +297 582 0000"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Note <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. Only for residents, changes annually"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-background">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editCode ? "Save changes" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-xl">🗑️</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Delete this entry?</h2>
            <p className="text-sm text-muted-foreground mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-background">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
