"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { getOrCreateIdentity } from "../chatIdentity";

type Session = { id: string; title: string; last_message_at: string };

type Props = {
  open: boolean;
  refreshKey: number;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: (id: string) => void;
  onDelete: (deletedId: string, fallbackId: string | null) => void;
};

const getUserId = () => {
  return getOrCreateIdentity().id;
};

const RecentsPanel = ({
  open,
  refreshKey,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) => {
  const [items, setItems] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    const r = await fetch("/api/chat/sessions", {
      headers: { "x-user-id": userId },
    });
    const j = await r.json();
    setItems(j?.sessions ?? []);
    setLoading(false);
  };

  const createNew = async () => {
    const userId = getUserId();
    if (!userId) return;

    const r = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ title: "New chat" }),
    });
    const j = await r.json();

    await load();
    if (j?.session?.id) onNew(j.session.id);
  };

  const remove = async (id: string) => {
    const userId = getUserId();
    if (!userId) return;

    const r = await fetch(`/api/chat/sessions/${id}`, {
      method: "DELETE",
      headers: { "x-user-id": userId },
    });
    const j = await r.json();
    if (!j?.ok) return;

    // 1) ავიღოთ მიმდინარე items სნეპშოტი
    const current = items;
    const idx = current.findIndex((s) => s.id === id);
    if (idx === -1) return;

    // 2) გავფილტროთ წაშლილი ჩატი
    const next = current.filter((s) => s.id !== id);

    // 3) ვიპოვოთ fallback ჩატი: ჯერ წინა, თუ არაა – პირველი, თუ არც – null
    const fallback = next[idx - 1] ?? next[0] ?? null;

    // 4) ლოკალურად განვაახლოთ სია
    setItems(next);

    // 5) მშობელს ვეტყვით: რომელი წავშალეთ და რომელზე უნდა გადავიდეს
    onDelete(id, fallback ? fallback.id : null);
  };

  useEffect(() => {
    if (open) load();
  }, [open, refreshKey]);

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
            <div
              key={s.id}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                activeId === s.id ? "bg-gray-200/70" : "hover:bg-gray-100"
              }`}
            >
              <button
                onClick={() => onSelect(s.id)}
                className="flex-1 text-left cursor-pointer"
              >
                <div className="text-sm font-medium text-gray-800 truncate">
                  {s.title}
                </div>
                <div className="text-[11px] text-gray-500 truncate">
                  {new Date(s.last_message_at).toLocaleString()}
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(s.id);
                }}
                aria-label="Delete chat"
                className="p-2 rounded-full hover:bg-red-50 text-red-600 cursor-pointer"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentsPanel;
