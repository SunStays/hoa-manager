"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Unit = {
  id: string;
  unitNumber: string;
  address: string | null;
  floor: number | null;
  sqm: number | null;
  monthlyDues: string;
  status: string;
  residents: { id: string; name: string; email: string; role: string }[];
};

const emptyForm = {
  unitNumber: "",
  address: "",
  floor: "",
  sqm: "",
  monthlyDues: "0",
  status: "occupied" as "occupied" | "vacant",
};

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadUnits() {
    const res = await fetch("/api/units");
    const data = await res.json();
    setUnits(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadUnits(); }, []);

  function openAdd() {
    setEditUnit(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(unit: Unit) {
    setEditUnit(unit);
    setForm({
      unitNumber: unit.unitNumber,
      address: unit.address ?? "",
      floor: unit.floor?.toString() ?? "",
      sqm: unit.sqm?.toString() ?? "",
      monthlyDues: unit.monthlyDues,
      status: unit.status as "occupied" | "vacant",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      unitNumber: form.unitNumber,
      address: form.address || undefined,
      floor: form.floor ? Number(form.floor) : undefined,
      sqm: form.sqm ? Number(form.sqm) : undefined,
      monthlyDues: Number(form.monthlyDues),
      status: form.status,
    };

    const res = await fetch(editUnit ? `/api/units/${editUnit.id}` : "/api/units", {
      method: editUnit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setSaving(false);
      return;
    }

    setShowModal(false);
    loadUnits();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/units/${id}`, { method: "DELETE" });
    setDeleteId(null);
    loadUnits();
  }

  const totalDues = units.reduce((sum, u) => sum + Number(u.monthlyDues), 0);
  const occupied = units.filter((u) => u.status === "occupied").length;
  const vacant = units.filter((u) => u.status === "vacant").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Units</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage all units in your community</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add unit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total units", value: units.length },
          { label: "Occupied", value: occupied },
          { label: "Vacant", value: vacant },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
      ) : units.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm mb-3">No units yet.</p>
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Add your first unit
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {units.map((unit) => (
              <div key={unit.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-foreground text-base">Unit #{unit.unitNumber}</p>
                    {unit.address && <p className="text-sm text-muted-foreground">{unit.address}</p>}
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {unit.residents.length === 0 ? "No residents" : unit.residents.map((r) => r.name).join(", ")}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    unit.status === "occupied" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
                  }`}>
                    {unit.status === "occupied" ? "Occupied" : "Vacant"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-3">{formatCurrency(Number(unit.monthlyDues))} / month</p>
                <div className="flex gap-2 pt-1 border-t border-border">
                  <button onClick={() => openEdit(unit)} className="flex-1 py-1.5 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors">Edit</button>
                  <button onClick={() => setDeleteId(unit.id)} className="flex-1 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">Delete</button>
                </div>
              </div>
            ))}
            <div className="bg-background rounded-xl border border-border px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total monthly dues</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(totalDues)}</span>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Unit</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Address</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Residents</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Monthly dues</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-b border-border hover:bg-background transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">#{unit.unitNumber}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{unit.address || "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {unit.residents.length === 0 ? (
                        <span className="text-muted-foreground">No residents</span>
                      ) : (
                        unit.residents.map((r) => r.name).join(", ")
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-foreground font-medium">{formatCurrency(Number(unit.monthlyDues))}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        unit.status === "occupied" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
                      }`}>
                        {unit.status === "occupied" ? "Occupied" : "Vacant"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openEdit(unit)} className="text-primary hover:underline text-xs font-medium mr-3">Edit</button>
                      <button onClick={() => setDeleteId(unit.id)} className="text-red-400 hover:underline text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-background border-t border-border">
                  <td colSpan={3} className="px-5 py-3 text-sm font-medium text-muted-foreground">Total monthly dues</td>
                  <td className="px-5 py-3 text-sm font-bold text-foreground">{formatCurrency(totalDues)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-foreground mb-5">
              {editUnit ? `Edit unit #${editUnit.unitNumber}` : "Add unit"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Unit number *</label>
                  <input
                    type="text"
                    value={form.unitNumber}
                    onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                    required
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "occupied" | "vacant" })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="occupied">Occupied</option>
                    <option value="vacant">Vacant</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Building A, Floor 2"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Floor</label>
                  <input
                    type="number"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Size (m²)</label>
                  <input
                    type="number"
                    value={form.sqm}
                    onChange={(e) => setForm({ ...form, sqm: e.target.value })}
                    placeholder="80"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Monthly dues ($)</label>
                  <input
                    type="number"
                    value={form.monthlyDues}
                    onChange={(e) => setForm({ ...form, monthlyDues: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/20 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editUnit ? "Save changes" : "Add unit"}
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
            <h2 className="text-lg font-bold text-foreground mb-2">Delete unit?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This will also remove all linked payments and maintenance requests.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-background"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
