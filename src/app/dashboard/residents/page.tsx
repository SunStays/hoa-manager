"use client";

import { useEffect, useState } from "react";

type Unit = { id: string; unitNumber: string };
type Resident = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  units: Unit[];
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "resident" as "resident" | "board" | "admin",
  unitIds: [] as string[],
  password: "",
};

const roleLabel: Record<string, string> = {
  admin: "Admin",
  board: "Board",
  resident: "Resident",
};

const roleBadge: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  board: "bg-blue-50 text-blue-700",
  resident: "bg-gray-100 text-gray-600",
};

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editResident, setEditResident] = useState<Resident | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadData() {
    const [rRes, uRes] = await Promise.all([fetch("/api/residents"), fetch("/api/units")]);
    const rData = await rRes.json();
    const uData = await uRes.json();
    setResidents(Array.isArray(rData) ? rData : []);
    setUnits(Array.isArray(uData) ? uData : []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function toggleUnit(unitId: string) {
    setForm((f) =>
      f.unitIds.includes(unitId)
        ? { ...f, unitIds: f.unitIds.filter((id) => id !== unitId) }
        : { ...f, unitIds: [...f.unitIds, unitId] }
    );
  }

  function openAdd() {
    setEditResident(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(r: Resident) {
    setEditResident(r);
    setForm({
      name: r.name,
      email: r.email,
      phone: r.phone ?? "",
      role: r.role as "resident" | "board" | "admin",
      unitIds: r.units.map((u) => u.id),
      password: "",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
      unitIds: form.unitIds,
      ...(form.password ? { password: form.password } : {}),
    };

    const res = await fetch(
      editResident ? `/api/residents/${editResident.id}` : "/api/residents",
      { method: editResident ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setSaving(false);
      return;
    }

    setShowModal(false);
    loadData();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/residents/${id}`, { method: "DELETE" });
    setDeleteId(null);
    loadData();
  }

  const boardCount = residents.filter((r) => r.role === "board").length;
  const residentCount = residents.filter((r) => r.role === "resident").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all residents and board members</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Add resident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total people", value: residents.length },
          { label: "Board members", value: boardCount },
          { label: "Residents", value: residentCount },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : residents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-3">No residents yet.</p>
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Add your first resident
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {residents.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <p className="text-sm text-gray-500">{r.email}</p>
                    {r.phone && <p className="text-sm text-gray-500">{r.phone}</p>}
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[r.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {roleLabel[r.role] ?? r.role}
                  </span>
                </div>
                {r.units.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {r.units
                      .slice()
                      .sort((a, b) => parseInt(a.unitNumber) - parseInt(b.unitNumber))
                      .map((u) => (
                        <span key={u.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          #{u.unitNumber}
                        </span>
                      ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1 border-t border-gray-50">
                  <button onClick={() => openEdit(r)} className="flex-1 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Edit</button>
                  <button onClick={() => setDeleteId(r.id)} className="flex-1 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Units</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Role</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{r.name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.email}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.phone || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {r.units.length === 0 ? (
                        <span className="text-gray-300">No unit</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {r.units
                            .slice()
                            .sort((a, b) => parseInt(a.unitNumber) - parseInt(b.unitNumber))
                            .map((u) => (
                              <span key={u.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                #{u.unitNumber}
                              </span>
                            ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[r.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {roleLabel[r.role] ?? r.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openEdit(r)} className="text-blue-600 hover:underline text-xs font-medium mr-3">Edit</button>
                      <button onClick={() => setDeleteId(r.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editResident ? `Edit ${editResident.name}` : "Add resident"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Maria Bosman"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="maria@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+297 700 0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "resident" | "board" | "admin" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="resident">Resident</option>
                  <option value="board">Board member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {!editResident && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-gray-400 font-normal">(optional — lets them log in)</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Units owned</label>
                {units.length === 0 ? (
                  <p className="text-sm text-gray-400">No units yet — add units first.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                    {units.map((u) => {
                      const selected = form.unitIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUnit(u.id)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selected
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          #{u.unitNumber}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving ? "Saving..." : editResident ? "Save changes" : "Add resident"}
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
            <h2 className="text-lg font-bold text-gray-900 mb-2">Remove resident?</h2>
            <p className="text-sm text-gray-500 mb-6">This will remove them from the community. Their payment history will remain.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
