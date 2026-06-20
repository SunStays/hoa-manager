"use client";

import { useEffect, useState } from "react";

type Unit = { id: string; unitNumber: string };
type VoteResponse = {
  id: string;
  unitId: string;
  userId: string;
  option: string;
  user: { id: string; name: string };
  unit: { id: string; unitNumber: string };
};
type Vote = {
  id: string;
  question: string;
  description: string | null;
  options: string[];
  closesAt: string;
  createdAt: string;
  responses: VoteResponse[];
};

function isOpen(vote: Vote) {
  return new Date() < new Date(vote.closesAt);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export default function VotesPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [myUnits, setMyUnits] = useState<Unit[]>([]);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [voting, setVoting] = useState<Record<string, boolean>>({});

  // Create form
  const [form, setForm] = useState({ question: "", description: "", closesAt: "" });
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    try {
      const [vRes, uRes, sRes] = await Promise.all([
        fetch("/api/votes"),
        fetch("/api/units/mine"),
        fetch("/api/auth/session"),
      ]);
      const vData = await vRes.json();
      const uData = await uRes.json();
      const sData = await sRes.json();
      setVotes(Array.isArray(vData) ? vData : []);
      setMyUnits(Array.isArray(uData) ? uData : []);
      setRole(sData?.user?.role ?? "");
    } catch {
      setVotes([]);
      setMyUnits([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const filled = options.filter((o) => o.trim());
    if (filled.length < 2) { setFormError("Add at least 2 options."); return; }
    setSaving(true);
    setFormError("");
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, options: filled }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || "Something went wrong."); setSaving(false); return; }
    setShowCreate(false);
    setForm({ question: "", description: "", closesAt: "" });
    setOptions(["", ""]);
    setSaving(false);
    load();
  }

  async function castVote(voteId: string, unitId: string, option: string) {
    setVoting((v) => ({ ...v, [`${voteId}-${unitId}`]: true }));
    await fetch(`/api/votes/${voteId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId, option }),
    });
    setVoting((v) => ({ ...v, [`${voteId}-${unitId}`]: false }));
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/votes/${id}`, { method: "DELETE" });
    setDeleteId(null);
    setExpandedId(null);
    load();
  }

  const isBoard = role === "board" || role === "admin";
  const open = votes.filter(isOpen);
  const closed = votes.filter((v) => !isOpen(v));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Votes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Community decisions, one unit one vote</p>
        </div>
        {isBoard && (
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + New vote
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
      ) : votes.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <p className="text-4xl mb-3">🗳️</p>
          <p className="text-muted-foreground text-sm mb-4">No votes yet.</p>
          {isBoard && (
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Create the first vote
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Open</h2>
              <div className="space-y-3">
                {open.map((vote) => (
                  <VoteCard
                    key={vote.id}
                    vote={vote}
                    myUnits={myUnits}
                    isBoard={isBoard}
                    expanded={expandedId === vote.id}
                    onToggle={() => setExpandedId(expandedId === vote.id ? null : vote.id)}
                    onVote={castVote}
                    onDelete={setDeleteId}
                    voting={voting}
                  />
                ))}
              </div>
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Closed</h2>
              <div className="space-y-3">
                {closed.map((vote) => (
                  <VoteCard
                    key={vote.id}
                    vote={vote}
                    myUnits={myUnits}
                    isBoard={isBoard}
                    expanded={expandedId === vote.id}
                    onToggle={() => setExpandedId(expandedId === vote.id ? null : vote.id)}
                    onVote={castVote}
                    onDelete={setDeleteId}
                    voting={voting}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-5">New vote</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Question *</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  required
                  placeholder="e.g. Should we repaint the lobby?"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Provide context to help residents decide..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Options *</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {options.length > 2 && (
                        <button type="button" onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-400 px-2">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 6 && (
                  <button type="button" onClick={() => setOptions([...options, ""])} className="mt-2 text-sm text-primary hover:underline">
                    + Add option
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Closes on *</label>
                <input
                  type="date"
                  value={form.closesAt}
                  onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formError && <p className="text-red-400 text-sm bg-red-500/20 px-3 py-2 rounded-lg">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-background">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Creating..." : "Create vote"}
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
            <h2 className="text-lg font-bold text-foreground mb-2">Delete this vote?</h2>
            <p className="text-sm text-muted-foreground mb-6">All responses will be lost. This cannot be undone.</p>
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

function VoteCard({
  vote, myUnits, isBoard, expanded, onToggle, onVote, onDelete, voting,
}: {
  vote: Vote;
  myUnits: Unit[];
  isBoard: boolean;
  expanded: boolean;
  onToggle: () => void;
  onVote: (voteId: string, unitId: string, option: string) => void;
  onDelete: (id: string) => void;
  voting: Record<string, boolean>;
}) {
  const open = isOpen(vote);
  const totalVotes = vote.responses.length;

  // Count per option
  const counts: Record<string, number> = {};
  vote.options.forEach((o) => (counts[o] = 0));
  vote.responses.forEach((r) => { counts[r.option] = (counts[r.option] ?? 0) + 1; });
  const maxCount = Math.max(...Object.values(counts), 1);

  // Which of my units have voted
  const myVotedUnitIds = new Set(vote.responses.map((r) => r.unitId));
  const myPendingUnits = myUnits.filter((u) => !myVotedUnitIds.has(u.id));
  const myVotedUnits = myUnits.filter((u) => myVotedUnitIds.has(u.id));

  return (
    <div className={`bg-card rounded-2xl border ${open ? "border-blue-100" : "border-border"} overflow-hidden`}>
      {/* Header row */}
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${open ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}`}>
              {open ? "Open" : "Closed"}
            </span>
            <span className="text-xs text-muted-foreground">{open ? `Closes ${formatDate(vote.closesAt)}` : `Closed ${formatDate(vote.closesAt)}`}</span>
          </div>
          <p className="font-semibold text-foreground">{vote.question}</p>
          <p className="text-xs text-muted-foreground mt-1">{totalVotes} vote{totalVotes !== 1 ? "s" : ""} cast</p>
        </div>
        <span className="text-muted-foreground text-sm mt-1">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-5">
          {vote.description && (
            <p className="text-sm text-muted-foreground">{vote.description}</p>
          )}

          {/* Results bar chart */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Results</p>
            {vote.options.map((opt) => {
              const count = counts[opt] ?? 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={opt}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{opt}</span>
                    <span className="text-muted-foreground">{count} vote{count !== 1 ? "s" : ""} · {pct}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalVotes > 0 ? (count / maxCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Who voted what */}
          {totalVotes > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Who voted what</p>
              <div className="space-y-1">
                {vote.options.map((opt) => {
                  const respondents = vote.responses.filter((r) => r.option === opt);
                  if (respondents.length === 0) return null;
                  return (
                    <div key={opt} className="bg-background rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold text-foreground mb-1.5">{opt}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {respondents.map((r) => (
                          <span key={r.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-border rounded-full text-xs text-muted-foreground">
                            {r.user.name} <span className="text-muted-foreground">· Unit #{r.unit.unitNumber}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cast vote — only for open votes where I have pending units */}
          {open && myPendingUnits.length > 0 && (
            <div className="border border-blue-100 rounded-xl p-4 bg-accent">
              <p className="text-sm font-semibold text-primary mb-3">Cast your vote</p>
              {myPendingUnits.map((unit) => (
                <div key={unit.id} className="mb-3 last:mb-0">
                  <p className="text-xs text-primary font-medium mb-2">Unit #{unit.unitNumber}</p>
                  <div className="flex flex-wrap gap-2">
                    {vote.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => onVote(vote.id, unit.id, opt)}
                        disabled={voting[`${vote.id}-${unit.id}`]}
                        className="px-3 py-1.5 bg-card border border-blue-300 text-primary text-sm font-medium rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors disabled:opacity-50"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show my already-cast votes */}
          {myVotedUnits.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your votes</p>
              <div className="flex flex-wrap gap-2">
                {myVotedUnits.map((unit) => {
                  const response = vote.responses.find((r) => r.unitId === unit.id);
                  return (
                    <span key={unit.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-200 rounded-full text-sm text-green-400">
                      ✓ Unit #{unit.unitNumber}: <strong>{response?.option}</strong>
                    </span>
                  );
                })}
              </div>
              {open && myPendingUnits.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">All your units have voted.</p>
              )}
            </div>
          )}

          {isBoard && (
            <div className="pt-2 border-t border-border">
              <button onClick={() => onDelete(vote.id)} className="text-sm text-red-400 hover:underline">Delete vote</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
