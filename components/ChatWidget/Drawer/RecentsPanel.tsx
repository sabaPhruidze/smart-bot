"use client";

import { useEffect, useState } from "react";

type Session = {
  id: string;
  title: string;
  last_message_at: string;
};

type Props = {
  activeId?: string | null;
  onSelect: (id: string) => void;
};

const getUserId = () => {
  try {
    const raw = localStorage.getItem("chat_user");
    const u = raw ? JSON.parse(raw) : null;
    return typeof u?.id === "string" ? u.id : null;
  } catch {
    return null;
  }
};

export default function RecentsPanel({ activeId, onSelect }: Props) {
  const [items, setItems] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const userId = getUserId();
    if (!userId) return setLoading(false);

    setLoading(true);
    const res = await fetch("/api/chat/sessions", {
      headers: { "x-user-id": userId },
    });
    const json = await res.json();
    setItems(json?.sessions ?? []);
    setLoading(false);
  };

  const createNew = async () => {
    const userId = getUserId();
    if (!userId) return;

    const res = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ title: "New chat" }),
    });
    const json = await res.json();
    const id = json?.session?.id as string | undefined;
    await load();
    if (id) onSelect(id);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-3">
      <button
        onClick={createNew}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 cursor-pointer"
      >
        + New chat
      </button>

      {loading ? (
        <div className="text-xs text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-gray-500">No chats yet.</div>
      ) : (
        <div className="space-y-1">
          {items.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm cursor-pointer ${
                activeId === s.id
                  ? "bg-gray-200/70 text-gray-900"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="font-medium truncate">{s.title}</div>
              <div className="text-[11px] text-gray-500 truncate">
                {new Date(s.last_message_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
