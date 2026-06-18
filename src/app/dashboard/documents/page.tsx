"use client";

import { useEffect, useRef, useState } from "react";

type Document = {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  uploadedBy: { name: string };
};

const CATEGORIES = [
  { value: "insurance", label: "Insurance" },
  { value: "tax", label: "Tax" },
  { value: "legal", label: "Legal" },
  { value: "minutes", label: "Meeting minutes" },
  { value: "financial", label: "Financial" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const categoryLabel: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

const categoryColor: Record<string, string> = {
  insurance: "bg-blue-50 text-blue-700",
  tax: "bg-yellow-50 text-yellow-700",
  legal: "bg-purple-50 text-purple-700",
  minutes: "bg-green-50 text-green-700",
  financial: "bg-orange-50 text-orange-700",
  maintenance: "bg-red-50 text-red-700",
  other: "bg-gray-100 text-gray-600",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadDocuments(); }, []);

  function openUpload() {
    setTitle("");
    setCategory("other");
    setFile(null);
    setUploadError("");
    setShowModal(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setUploadError("Please select a file."); return; }
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("category", category);

    const res = await fetch("/api/documents", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setUploadError(data.error || "Upload failed.");
      setUploading(false);
      return;
    }

    setShowModal(false);
    setUploading(false);
    loadDocuments();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDeleteId(null);
    loadDocuments();
  }

  const filtered = filterCategory === "all"
    ? documents
    : documents.filter((d) => d.category === filterCategory);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm mt-0.5">Upload and manage community documents</p>
        </div>
        <button
          onClick={openUpload}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Upload document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: documents.length },
          { label: "Insurance", value: documents.filter((d) => d.category === "insurance").length },
          { label: "Tax", value: documents.filter((d) => d.category === "tax").length },
          { label: "Legal", value: documents.filter((d) => d.category === "legal").length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[{ value: "all", label: "All" }, ...CATEGORIES].map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterCategory === c.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm mb-3">
              {documents.length === 0 ? "No documents yet." : "No documents in this category."}
            </p>
            {documents.length === 0 && (
              <button onClick={openUpload} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Upload your first document
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Category</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Size</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Uploaded by</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {doc.title}
                    </a>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor[doc.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {categoryLabel[doc.category] ?? doc.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatBytes(doc.fileSize)}</td>
                  <td className="px-5 py-3.5 text-gray-600">{doc.uploadedBy.name}</td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(doc.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs font-medium mr-3"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => setDeleteId(doc.id)}
                      className="text-red-500 hover:underline text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Upload document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Building Insurance 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, or image — max 10 MB</p>
              </div>

              {file && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                  {file.name} — {formatBytes(file.size)}
                </div>
              )}

              {uploadError && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
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
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete document?</h2>
            <p className="text-sm text-gray-500 mb-6">The file will be permanently removed and cannot be recovered.</p>
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
