"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  attachments: string[];
  publishedAt: string;
  author: { name: string; role: string };
};

const emptyForm = { title: "", body: "", pinned: false };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fileName(url: string) {
  return decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "file").replace(/^\d+-/, "");
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setAnnouncements(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  function openNew() {
    setEditItem(null);
    setForm(emptyForm);
    setFiles([]);
    setError("");
    setShowModal(true);
  }

  function openEdit(a: Announcement) {
    setEditItem(a);
    setForm({ title: a.title, body: a.body, pinned: a.pinned });
    setFiles([]);
    setError("");
    setShowModal(true);
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("body", form.body);
    fd.append("pinned", String(form.pinned));
    files.forEach((f) => fd.append("files", f));
    return fd;
  }

  async function sendTestEmail() {
    if (!form.title || !form.body) { setError("Fill in subject and message first."); return; }
    setSendingTest(true);
    setError("");
    const res = await fetch("/api/announcements/test-email", { method: "POST", body: buildFormData() });
    setSendingTest(false);
    if (res.ok) { setTestSent(true); setTimeout(() => setTestSent(false), 4000); }
    else { const d = await res.json(); setError(d.error || "Failed to send test."); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let res: Response;
    if (editItem) {
      res = await fetch(`/api/announcements/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, body: form.body, pinned: form.pinned }),
      });
    } else {
      res = await fetch("/api/announcements", { method: "POST", body: buildFormData() });
    }

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); setSaving(false); return; }

    setShowModal(false);
    setSaving(false);
    load();
  }

  async function togglePin(a: Announcement) {
    await fetch(`/api/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: a.title, body: a.body, pinned: !a.pinned }),
    });
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  const pinned = announcements.filter((a) => a.pinned);
  const regular = announcements.filter((a) => !a.pinned);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-0.5">Board messages to the community</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + New announcement
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-3">📢</p>
          <p className="text-gray-500 text-sm mb-4">No announcements yet.</p>
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Post your first announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pinned.map((a) => <AnnouncementCard key={a.id} a={a} onEdit={openEdit} onDelete={setDeleteId} onTogglePin={togglePin} />)}
          {regular.map((a) => <AnnouncementCard key={a.id} a={a} onEdit={openEdit} onDelete={setDeleteId} onTogglePin={togglePin} />)}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editItem ? "Edit announcement" : "New announcement"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Pool maintenance scheduled for Saturday"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  required
                  rows={6}
                  placeholder="Write your message to residents here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Attachments — only for new announcements */}
              {!editItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-colors ${
                      dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <input ref={fileRef} type="file" accept="*/*" multiple onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])} className="hidden" />
                    <span className="text-xl">📎</span>
                    <p className="text-xs text-gray-500">Drag & drop files or click to browse</p>
                  </div>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {files.map((f, i) => (
                        <li key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600">
                          <span>📄 {f.name}</span>
                          <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 ml-2">✕</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">📌 Pin this announcement to the top</span>
              </label>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              {testSent && <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">✅ Test email sent to your inbox!</p>}

              {!editItem && (
                <button type="button" onClick={sendTestEmail} disabled={sendingTest} className="w-full px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  {sendingTest ? "Sending test..." : "📧 Send test email to me"}
                </button>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving ? "Posting..." : editItem ? "Save changes" : "Post to all residents"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">🗑️</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete announcement?</h2>
            <p className="text-sm text-gray-500 mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ a, onEdit, onDelete, onTogglePin }: {
  a: Announcement;
  onEdit: (a: Announcement) => void;
  onDelete: (id: string) => void;
  onTogglePin: (a: Announcement) => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${a.pinned ? "border-blue-200 shadow-sm" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {a.pinned && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">📌 Pinned</span>}
            <h3 className="text-base font-bold text-gray-900">{a.title}</h3>
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{a.body}</p>
          {a.attachments?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {a.attachments.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors">
                  📎 {fileName(url)}
                </a>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Posted by <span className="font-medium text-gray-500">{a.author.name}</span> · {formatDate(a.publishedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onTogglePin(a)} title={a.pinned ? "Unpin" : "Pin to top"} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm">📌</button>
          <button onClick={() => onEdit(a)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs font-medium">Edit</button>
          <button onClick={() => onDelete(a.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium">Delete</button>
        </div>
      </div>
    </div>
  );
}
