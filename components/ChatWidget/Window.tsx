"use client";

import { useState, useRef } from "react";
import Drawer from "./Drawer/Drawer";
import Header from "./Header";
import InputArea from "./InputArea";
import MessagesArea from "./MessagesArea";
import RecentsPanel from "./Drawer/RecentsPanel";
import VoiceWindow from "./VoiceWindow";
import { getOrCreateIdentity } from "./chatIdentity";

export type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status?: "sending" | "typing";
};

const getUserId = () => {
  return getOrCreateIdentity().id;
};

const Window = ({
  onClose,
  showSignIn,
  onSignIn,
}: {
  onClose: () => void;
  showSignIn: boolean;
  onSignIn: () => void;
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [voiceOpen, setVoiceOpen] = useState(false);

  // keep if you still want to avoid an extra load right after creating chat
  const skipNextLoadRef = useRef(false);

  const loadMessages = async (sessionId: string) => {
    const userId = getUserId();
    if (!userId) return;

    const r = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
      headers: { "x-user-id": userId },
    });
    const j = await r.json();

    setMessages(
      (j?.messages ?? []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }))
    );
  };

  const newChat = async (): Promise<string | null> => {
    const userId = getUserId();
    if (!userId) return null;

    const r = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ title: "New chat" }),
    });

    const j = await r.json();
    const id = (j?.session?.id as string | undefined) ?? null;

    setMessages([]);
    if (id) {
      skipNextLoadRef.current = true;
      setActiveId(id);
    }
    setRefreshKey((k) => k + 1);

    return id;
  };

  const sendMessage = async (text: string) => {
    const userId = getUserId();
    if (!userId) return;

    let sessionId = activeId;
    if (!sessionId) sessionId = await newChat();
    if (!sessionId) return;

    const tmpUserId = `tmp-u-${Date.now()}`;
    const tmpBotId = `tmp-a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: tmpUserId, role: "user", content: text, status: "sending" },
      { id: tmpBotId, role: "assistant", content: "", status: "typing" },
    ]);

    try {
      const r = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ sessionId, role: "user", content: text }),
      });

      const j = await r.json();

      if (!j?.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tmpBotId
              ? {
                  ...m,
                  status: undefined,
                  content: j?.error || "Server error. Please try again.",
                }
              : m
          )
        );
        return;
      }

      const u = j.userMessage;
      const a = j.assistantMessage;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === tmpUserId) return { id: u.id, role: u.role, content: u.content };
          if (m.id === tmpBotId) return { id: a.id, role: a.role, content: a.content };
          return m;
        })
      );

      setRefreshKey((k) => k + 1);
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tmpBotId
            ? {
                ...m,
                status: undefined,
                content: "Network error. Please try again.",
              }
            : m
        )
      );
    }
  };

  const handleSessionDelete = (deletedId: string, fallbackId: string | null) => {
    setActiveId((current) => {
      if (current === deletedId) return fallbackId;
      return current;
    });

    if (!fallbackId) {
      setMessages([]);
    } else {
      // ✅ load messages for fallback without useEffect
      void loadMessages(fallbackId);
    }
  };

  return (
    <div className="relative bg-white shadow-2xl flex flex-col border border-gray-100 overflow-hidden w-full h-full rounded-none sm:w-100 sm:h-150 sm:rounded-2xl sm:border sm:border-gray-100">
      <Header
        onClose={onClose}
        onToggleDrawer={() => setDrawerOpen((p) => !p)}
        onNewChat={() => {
          void newChat();
        }}
        showSignIn={showSignIn}
        onSignIn={onSignIn}
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <RecentsPanel
          open={drawerOpen}
          refreshKey={refreshKey}
          activeId={activeId}
          onSelect={(id) => {
            // ✅ load here (no effect)
            setActiveId(id);
            skipNextLoadRef.current = false;
            void loadMessages(id);

            setDrawerOpen(false);
          }}
          onNew={(id) => {
            setActiveId(id);
            setMessages([]);
            setDrawerOpen(false);
          }}
          onDelete={handleSessionDelete}
        />
      </Drawer>

      <MessagesArea messages={messages} />

      {voiceOpen && (
        <div className="absolute inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <VoiceWindow onClose={() => setVoiceOpen(false)} />
        </div>
      )}

      <InputArea onSendMessage={sendMessage} onVoiceClick={() => setVoiceOpen(true)} />
    </div>
  );
};

export default Window;
