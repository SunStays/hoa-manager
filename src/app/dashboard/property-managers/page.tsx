"use client";

import { useEffect, useState } from "react";

type Unit = {
  id: string;
  unitNumber: string;
  pmName: string | null;
  pmPhone: string | null;
  pmEmail: string | null;
  residents: { name: string }[];
};

type Community = {
  buildingPmName: string | null;
  buildingPmPhone: string | null;
  buildingPmEmail: string | null;
};

const emptyPm = { pmName: "", pmPhone: "", pmEmail: "" };
const emptyBuilding = { buildingPmName: "", buildingPmPhone: "", buildingPmEmail: "" };

export default function PropertyManagersPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState(emptyPm);
  const [editBuilding, setEditBuilding] = useState(false);
  const [buildingForm, setBuildingForm] = useState(emptyBuilding);
  const [saving, setSaving] = useState(false);
  const [savingBuilding, setSavingBuilding] = useState(false);
  const [error, setError] = useState("");
  const [buildingError, setBuildingError] = useState("");

  async function load() {
    const [uRes, cRes] = await Promise.all([fetch("/api/units"), fetch("/api/community")]);
    const uData = await uRes.json();
    const cData = await cRes.json();
    setUnits(Array.isArray(uData) ? uData : []);
    setCommunity(cData ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(unit: Unit) {
    setEditUnit(unit);
    setForm({
      pmName: unit.pmName ?? "",
      pmPhone: unit.pmPhone ?? "",
      pmEmail: unit.pmEmail ?? "",
    });
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editUnit) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/units/${editUnit.id}/manager`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Something went wrong.");
      setSaving(false);
      return;
    }

    setEditUnit(null);
    setSaving(false);
    load();
  }

  async function handleSaveBuilding(e: React.FormEvent) {
    e.preventDefault();
    setSavingBuilding(true);
    setBuildingError("");
    const res = await fetch("/api/community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildingForm),
    });
    if (!res.ok) {
      const d = await res.json();
      setBuildingError(d.error || "Something went wrong.");
      setSavingBuilding(false);
      return;
    }
    setEditBuilding(false);
    setSavingBuilding(false);
    load();
  }

  async function handleClear(unit: Unit) {
    await fetch(`/api/units/${unit.id}/manager`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pmName: null, pmPhone: null, pmEmail: null }),
    });
    load();
  }

  const withManager = units.filter((u) => u.pmName);
  const withoutManager = units.filter((u) => !u.pmName);

  function exportCSV() {
    const rows: string[][] = [["Type", "Unit #", "Residents", "PM Name", "PM Phone", "PM Email"]];
    if (community?.buildingPmName) {
      rows.push(["Building", "", "", community.buildingPmName, community.buildingPmPhone ?? "", community.buildingPmEmail ?? ""]);
    }
    for (const u of units) {
      rows.push([
        "Unit",
        u.unitNumber,
        u.residents.map((r) => r.name).join("; "),
        u.pmName ?? "",
        u.pmPhone ?? "",
        u.pmEmail ?? "",
      ]);
    }
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "property-managers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Managers</h1>
          <p className="text-gray-500 text-sm mt-0.5">Property manager per apartment</p>
        </div>
        {!loading && (
          <button
            onClick={exportCSV}
            className="shrink-0 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Building-level management company */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Building Management</p>
                <p className="text-sm text-blue-800 font-medium mb-1">Supervises the outside of the complex</p>
                {community?.buildingPmName ? (
                  <div>
                    <p className="font-bold text-gray-900">{community.buildingPmName}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                      {community.buildingPmPhone && (
                        <a href={`tel:${community.buildingPmPhone}`} className="text-sm text-blue-600 hover:underline">
                          📞 {community.buildingPmPhone}
                        </a>
                      )}
                      {community.buildingPmEmail && (
                        <a href={`mailto:${community.buildingPmEmail}`} className="text-sm text-blue-600 hover:underline">
                          ✉️ {community.buildingPmEmail}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-blue-400 italic">Not set yet</p>
                )}
              </div>
              <button
                onClick={() => {
                  setBuildingForm({
                    buildingPmName: community?.buildingPmName ?? "",
                    buildingPmPhone: community?.buildingPmPhone ?? "",
                    buildingPmEmail: community?.buildingPmEmail ?? "",
                  });
                  setBuildingError("");
                  setEditBuilding(true);
                }}
                className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
              >
                {community?.buildingPmName ? "Edit" : "+ Add"}
              </button>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">With manager</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{withManager.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">No manager set</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{withoutManager.length}</p>
            </div>
          </div>

          {/* Units with manager */}
          {withManager.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Assigned</h2>
              <div className="space-y-3">
                {withManager.map((unit) => (
                  <div key={unit.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">Unit #{unit.unitNumber}</span>
                          {unit.residents.length > 0 && (
                            <span className="text-xs text-gray-400">· {unit.residents.map((r) => r.name).join(", ")}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{unit.pmName}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                          {unit.pmPhone && (
                            <a href={`tel:${unit.pmPhone}`} className="text-sm text-blue-600 hover:underline">
                              📞 {unit.pmPhone}
                            </a>
                          )}
                          {unit.pmEmail && (
                            <a href={`mailto:${unit.pmEmail}`} className="text-sm text-blue-600 hover:underline">
                              ✉️ {unit.pmEmail}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEdit(unit)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleClear(unit)} className="text-xs font-medium text-red-400 hover:underline">Clear</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Units without manager */}
          {withoutManager.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">No manager assigned</h2>
              <div className="space-y-2">
                {withoutManager.map((unit) => (
                  <div key={unit.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">Unit #{unit.unitNumber}</span>
                      {unit.residents.length > 0 && (
                        <span className="text-xs text-gray-400 ml-2">{unit.residents.map((r) => r.name).join(", ")}</span>
                      )}
                    </div>
                    <button onClick={() => openEdit(unit)} className="text-sm font-medium text-blue-600 hover:underline">+ Add</button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Building management modal */}
      {editBuilding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Building Management Company</h2>
            <p className="text-sm text-gray-500 mb-5">Supervises the outside of the complex</p>
            <form onSubmit={handleSaveBuilding} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company / person name *</label>
                <input
                  type="text"
                  value={buildingForm.buildingPmName}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingPmName: e.target.value })}
                  required
                  placeholder="e.g. Las Islas Property Services"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={buildingForm.buildingPmPhone}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingPmPhone: e.target.value })}
                  placeholder="+297 700 0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={buildingForm.buildingPmEmail}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingPmEmail: e.target.value })}
                  placeholder="info@lasislaspm.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {buildingError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{buildingError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditBuilding(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={savingBuilding} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {savingBuilding ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Add modal */}
      {editUnit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {editUnit.pmName ? "Edit property manager" : "Add property manager"}
            </h2>
            <p className="text-sm text-gray-500 mb-5">Unit #{editUnit.unitNumber}</p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                <input
                  type="text"
                  value={form.pmName}
                  onChange={(e) => setForm({ ...form, pmName: e.target.value })}
                  required
                  placeholder="e.g. Maria Bosman"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.pmPhone}
                  onChange={(e) => setForm({ ...form, pmPhone: e.target.value })}
                  placeholder="+297 700 0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.pmEmail}
                  onChange={(e) => setForm({ ...form, pmEmail: e.target.value })}
                  placeholder="manager@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditUnit(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
