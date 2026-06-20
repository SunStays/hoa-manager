"use client";

import { useEffect, useRef, useState } from "react";

type Sender = { id: string; name: string; role: string };

type Message = {
  id: string;
  body: string;
  senderId: string;
  sender: Sender;
  createdAt: string;
  readAt: string | null;
};

type Thread = {
  id: string;
  residentId: string;
  resident: Sender;
  messages: Message[];
  unreadCount?: number;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function ConversationPane({
  thread,
  myId,
  onMessageSent,
}: {
  thread: Thread;
  myId: string;
  onMessageSent: (msg: Message) => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages]);

  useEffect(() => {
    fetch(`/api/threads/${thread.id}/read`, { method: "POST" });
  }, [thread.id]);

  async function send() {
    if (!body.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/threads/${thread.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const msg = await res.json();
      onMessageSent(msg);
      setBody("");
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border shrink-0">
        <p className="font-semibold text-foreground">{thread.resident.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{thread.resident.role}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation.</p>
        )}
        {thread.messages.map((m) => {
          const isMe = m.senderId === myId;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!isMe && (
                  <span className="text-xs text-muted-foreground px-1">{m.sender.name}</span>
                )}
                <div
                  className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.body}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">{formatTime(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[40px] max-h-32"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={send}
            disabled={!body.trim() || sending}
            className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [myId, setMyId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [residents, setResidents] = useState<Sender[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [residentThread, setResidentThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        setMyId(me.id);
        setRole(me.role);

        const isBoard = me.role === "board" || me.role === "admin";
        if (isBoard) {
          fetch("/api/threads")
            .then((r) => r.json())
            .then((data) => { setThreads(Array.isArray(data) ? data : []); setLoading(false); });
          fetch("/api/residents")
            .then((r) => r.json())
            .then((data) => setResidents(Array.isArray(data) ? data.filter((u: Sender) => u.id !== me.id) : []));
        } else {
          fetch("/api/threads")
            .then((r) => r.json())
            .then((data) => { setResidentThread(data); setLoading(false); });
        }
      });
  }, []);

  const isBoard = role === "board" || role === "admin";
  const selected = threads.find((t) => t.id === selectedId) ?? null;

  async function startThread(residentId: string) {
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ residentId }),
    });
    if (res.ok) {
      const thread: Thread = await res.json();
      setThreads((prev) => {
        const exists = prev.find((t) => t.id === thread.id);
        return exists ? prev : [{ ...thread, unreadCount: 0 }, ...prev];
      });
      setSelectedId(thread.id);
      setShowPicker(false);
    }
  }

  async function startResidentThread() {
    const res = await fetch("/api/threads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (res.ok) setResidentThread(await res.json());
  }

  function handleMessageSent(threadId: string, msg: Message) {
    if (isBoard) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t
        )
      );
    } else {
      setResidentThread((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
    }
  }

  function selectThread(id: string) {
    setSelectedId(id);
    setThreads((prev) => prev.map((t) => t.id === id ? { ...t, unreadCount: 0 } : t));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading…</div>;
  }

  // Resident view
  if (!isBoard) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-6">Messages</h1>
        <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
          {residentThread ? (
            <ConversationPane
              thread={residentThread}
              myId={myId!}
              onMessageSent={(msg) => handleMessageSent(residentThread.id, msg)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <span className="text-4xl">💬</span>
              <p className="text-sm">No conversation yet with the board.</p>
              <button
                onClick={startResidentThread}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                Start conversation
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Board view
  const pickerResidents = residents.filter((r) => !threads.find((t) => t.residentId === r.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <button
          onClick={() => setShowPicker(true)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          + New conversation
        </button>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border p-5 w-80 shadow-xl">
            <h2 className="font-semibold text-foreground mb-3">Select person</h2>
            {pickerResidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Everyone already has a conversation.</p>
            ) : (
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {pickerResidents.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => startThread(r.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary text-foreground"
                    >
                      {r.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setShowPicker(false)}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden flex" style={{ height: "calc(100vh - 180px)" }}>
        {/* Inbox list */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No conversations yet.</p>
            ) : (
              threads.map((t) => {
                const last = t.messages[0];
                const isActive = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    onClick={() => selectThread(t.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-border transition-colors ${
                      isActive ? "bg-accent" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">{t.resident.name}</span>
                      {(t.unreadCount ?? 0) > 0 && (
                        <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                    {last && (
                      <p className="text-xs text-muted-foreground truncate">{last.body}</p>
                    )}
                    {last && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(last.createdAt)}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation pane */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <ConversationPane
              key={selected.id}
              thread={selected}
              myId={myId!}
              onMessageSent={(msg) => handleMessageSent(selected.id, msg)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <span className="text-4xl">💬</span>
              <p className="text-sm">Select a conversation or start a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
