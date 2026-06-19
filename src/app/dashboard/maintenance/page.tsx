"use client";

import { useEffect, useState } from "react";

type Unit = { id: string; unitNumber: string };
type Update = { id: string; message: string; status: string | null; createdAt: string; author: { name: string; role: string } };
type AnnouncementRef = { id: string; title: string; body: string; publishedAt: string; author: { name: string } };
type Request = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  notes: string | null;
  createdAt: string;
  unit: { unitNumber: string };
  submittedBy: { name: string };
  updates: Update[];
  announcements: AnnouncementRef[];
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-yellow-50 text-yellow-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  medium: "bg-orange-50 text-orange-600",
  high: "bg-red-50 text-red-600",
};

const emptyForm = { title: "", description: "", unitId: "", priority: "medium" };

export default function MaintenancePage() {
  const [role, setRole] = useState<string | null>(null);
  const isBoard = role === "board" || role === "admin";

  const [requests, setRequests] = useState<Request[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState<Request | null>(null);
  const [updateMsg, setUpdateMsg] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);

  async function load() {
    const [mRes, uRes, meRes] = await Promise.all([
      fetch("/api/maintenance"),
      fetch("/api/units/mine"),
      fetch("/api/me"),
    ]);
    const mData = await mRes.json();
    const uData = await uRes.json();
    const meData = await meRes.json();
    setRequests(Array.isArray(mData) ? mData : []);
    setUnits(Array.isArray(uData) ? uData : []);
    setRole(meData?.role ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Keep selected in sync after reload
  useEffect(() => {
    if (selected) {
      const fresh = requests.find((r) => r.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [requests]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || "Something went wrong."); setSaving(false); return; }
    setShowForm(false);
    setForm(emptyForm);
    setSaving(false);
    load();
  }

  async function handlePostUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !updateMsg.trim()) return;
    setPostingUpdate(true);
    await fetch(`/api/maintenance/${selected.id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: updateMsg, status: updateStatus || undefined }),
    });
    setUpdateMsg("");
    setUpdateStatus("");
    setPostingUpdate(false);
    await load();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const open = requests.filter((r) => r.status === "open");
  const inProgress = requests.filter((r) => r.status === "in_progress");
  const resolved = requests.filter((r) => ["resolved", "closed"].includes(r.status));

  function RequestCard({ r }: { r: Request }) {
    return (
      <div
        onClick={() => setSelected(r)}
        className="bg-white rounded-xl border border-gray-100 px-5 py-4 cursor-pointer hover:border-gray-200 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-gray-900">{r.title}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[r.priority] ?? "bg-gray-100 text-gray-500"}`}>
                {r.priority}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Unit #{r.unit.unitNumber} · {r.submittedBy.name} · {new Date(r.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>
          </div>
          {(r.updates.length > 0 || r.announcements.length > 0) && (
            <span className="shrink-0 text-xs text-blue-500 mt-0.5">
              {r.updates.length + r.announcements.length} update{r.updates.length + r.announcements.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    );
  }

  function Section({ label, items }: { label: string; items: Request[] }) {
    if (items.length === 0) return null;
    return (
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{label}</h2>
        <div className="space-y-2">{items.map((r) => <RequestCard key={r.id} r={r} />)}</div>
      </section>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance / Request</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isBoard ? "All maintenance requests from residents" : "Submit and track your maintenance requests"}
          </p>
        </div>
        {!isBoard && (
          <button
            onClick={() => { setShowForm(true); setFormError(""); setForm(emptyForm); }}
            className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + New Request
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-3">🔧</p>
          <p className="text-gray-500 text-sm mb-4">
            {isBoard ? "No maintenance requests yet." : "No requests yet. Submit one if something needs attention."}
          </p>
          {!isBoard && (
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Submit a request
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Section label="Open" items={open} />
          <Section label="In Progress" items={inProgress} />
          <Section label="Resolved / Closed" items={resolved} />
        </div>
      )}

      {/* Submit request modal (residents) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">New Maintenance Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Leaking faucet in bathroom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>Unit #{u.unitNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {formError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Unit #{selected.unit.unitNumber} · {selected.submittedBy.name} · {new Date(selected.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {/* Status + priority badges */}
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[selected.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_COLOR[selected.priority] ?? "bg-gray-100 text-gray-500"}`}>
                  {selected.priority} priority
                </span>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.description}</p>
              </div>

              {/* Board status controls */}
              {isBoard && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Change Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABEL).map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => handleStatusChange(selected.id, val)}
                        disabled={selected.status === val}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          selected.status === val
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcements linked to this request */}
              {selected.announcements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">📣 Announcements</p>
                  <div className="space-y-2">
                    {selected.announcements.map((a) => (
                      <div key={a.id} className="bg-blue-50 rounded-lg px-4 py-3">
                        <p className="text-sm font-semibold text-blue-900">{a.title}</p>
                        <p className="text-xs text-blue-700 mt-0.5">{a.body}</p>
                        <p className="text-xs text-blue-400 mt-1">{a.author.name} · {new Date(a.publishedAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Updates timeline */}
              {selected.updates.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Updates</p>
                  <div className="space-y-3">
                    {selected.updates.map((u) => (
                      <div key={u.id} className="flex gap-3">
                        <div className="w-1.5 rounded-full bg-blue-200 shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-700">{u.message}</p>
                          {u.status && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_COLOR[u.status] ?? "bg-gray-100 text-gray-500"}`}>
                              → {STATUS_LABEL[u.status] ?? u.status}
                            </span>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{u.author.name} · {new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Board: post update */}
              {isBoard && (
                <form onSubmit={handlePostUpdate} className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Post Update</p>
                  <textarea
                    value={updateMsg}
                    onChange={(e) => setUpdateMsg(e.target.value)}
                    rows={3}
                    placeholder="Write an update for the resident..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No status change</option>
                      {Object.entries(STATUS_LABEL).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={postingUpdate || !updateMsg.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {postingUpdate ? "Posting..." : "Post"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
