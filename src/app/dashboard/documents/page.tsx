"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Document = {
  id: string;
  title: string;
  category: string;
  year: number | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  uploadedBy: { name: string };
};

const FOLDERS = [
  { value: "tax",        label: "Tax",                    icon: "📄", color: "bg-yellow-500/20 border-yellow-200", textColor: "text-yellow-400" },
  { value: "insurance",  label: "Insurance",              icon: "🛡️", color: "bg-accent border-blue-200",   textColor: "text-primary" },
  { value: "maintenance",label: "Maintenance",            icon: "🔧", color: "bg-red-500/20 border-red-200",     textColor: "text-red-400" },
  { value: "agm",        label: "Annual General Meeting", icon: "📋", color: "bg-green-500/20 border-green-200", textColor: "text-green-400" },
  { value: "legal",      label: "Legal",                  icon: "⚖️", color: "bg-purple-50 border-purple-200",textColor: "text-purple-800" },
  { value: "projects",   label: "Projects",               icon: "🏗️", color: "bg-orange-500/20 border-orange-200",textColor: "text-orange-400" },
  { value: "appraisals", label: "Appraisals",             icon: "🏠", color: "bg-teal-50 border-teal-200",   textColor: "text-teal-800" },
  { value: "other",      label: "Other",                  icon: "📁", color: "bg-background border-border",   textColor: "text-foreground" },
];

const YEARS = Array.from({ length: 16 }, (_, i) => 2020 + i); // 2020–2035

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
  const [role, setRole] = useState<string | null>(null);
  const isBoard = role === "board" || role === "admin";
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  async function loadDocuments() {
    try {
      const [docsRes, meRes] = await Promise.all([fetch("/api/documents"), fetch("/api/me")]);
      const data = await docsRes.json();
      const me = await meRes.json();
      setDocuments(Array.isArray(data) ? data : []);
      setRole(me?.role ?? null);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDocuments(); }, []);

  function openUpload() {
    setTitle("");
    setCategory(currentFolder ?? "other");
    setYear(currentYear ?? new Date().getFullYear());
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
    formData.append("year", String(year));

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

  const folder = FOLDERS.find((f) => f.value === currentFolder);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>;
  }

/* ── Level 1: Folder grid ── */
  if (!currentFolder) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage community documents by folder and year</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FOLDERS.map((f) => {
            const count = documents.filter((d) => d.category === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => { setCurrentFolder(f.value); setCurrentYear(null); }}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left hover:shadow-md transition-shadow ${f.color}`}
              >
                <span className="text-3xl mb-3">{f.icon}</span>
                <p className={`font-semibold text-sm ${f.textColor}`}>{f.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{count} {count === 1 ? "doc" : "docs"}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Level 2: Year grid ── */
  if (!currentYear) {
    const folderDocs = documents.filter((d) => d.category === currentFolder);
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setCurrentFolder(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Folders</button>
          <span className="text-muted-foreground">|</span>
          <h1 className="text-2xl font-bold text-foreground">{folder?.icon} {folder?.label}</h1>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {YEARS.map((y) => {
            const count = folderDocs.filter((d) => d.year === y).length;
            const isCurrent = y === new Date().getFullYear();
            return (
              <button
                key={y}
                onClick={() => setCurrentYear(y)}
                className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 font-semibold text-sm transition-all hover:shadow-md ${
                  isCurrent
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-card border-border text-foreground hover:border-blue-400"
                }`}
              >
                <span>{y}</span>
                {count > 0 && (
                  <span className={`text-xs mt-0.5 font-normal ${isCurrent ? "text-blue-100" : "text-muted-foreground"}`}>
                    {count} {count === 1 ? "doc" : "docs"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Level 3: Document list ── */
  const yearDocs = documents.filter((d) => d.category === currentFolder && d.year === currentYear);

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setCurrentFolder(null); setCurrentYear(null); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Folders</button>
          <span className="text-muted-foreground">/</span>
          <button onClick={() => setCurrentYear(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{folder?.icon} {folder?.label}</button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold text-foreground">{currentYear}</h1>
        </div>
        {isBoard && (
          <button
            onClick={openUpload}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Upload document
          </button>
        )}
      </div>

      {/* Document list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {yearDocs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm mb-3">No documents in {folder?.label} / {currentYear} yet.</p>
            {isBoard && (
              <button onClick={openUpload} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Upload first document
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Size</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Uploaded by</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {yearDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-border hover:bg-background transition-colors">
                  <td className="px-5 py-3.5">
                    <a href={`/api/documents/${doc.id}/download`} className="font-semibold text-foreground hover:text-primary hover:underline">
                      {doc.title}
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{formatBytes(doc.fileSize)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{doc.uploadedBy.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <a href={`/api/documents/${doc.id}/download`} className="text-primary hover:underline text-xs font-medium mr-3">Download</a>
                    {isBoard && <button onClick={() => setDeleteId(doc.id)} className="text-red-400 hover:underline text-xs font-medium">Delete</button>}
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
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-foreground mb-5">Upload document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Building Insurance 2025"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Folder *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {FOLDERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Year *</label>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">File *</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-blue-400 hover:bg-accent transition-colors"
                  >
                    📂 Browse file
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-blue-400 hover:bg-accent transition-colors"
                  >
                    📷 Take photo
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="*/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                {file && (
                  <div className="flex items-center justify-between bg-green-500/20 border border-green-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-green-400">{file.name}</p>
                      <p className="text-xs text-green-600">{formatBytes(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => setFile(null)} className="text-green-500 hover:text-green-400 text-lg leading-none">✕</button>
                  </div>
                )}
              </div>
              {uploadError && <p className="text-red-400 text-sm bg-red-500/20 px-3 py-2 rounded-lg">{uploadError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-background transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
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
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-xl">🗑️</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Delete document?</h2>
            <p className="text-sm text-muted-foreground mb-6">The file will be permanently removed and cannot be recovered.</p>
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
