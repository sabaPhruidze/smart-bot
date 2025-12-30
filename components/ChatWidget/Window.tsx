"use client";

import { useEffect, useState } from "react";
import Drawer from "./Drawer/Drawer";
import Header from "./Header";
import InputArea from "./InputArea";
import MessagesArea from "./MessagesArea";
import RecentsPanel from "./Drawer/RecentsPanel";
import { getOrCreateIdentity } from "./chatIdentity";

export type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
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
    if (id) setActiveId(id);
    setRefreshKey((k) => k + 1);

    return id;
  };

  const sendMessage = async (text: string) => {
    const userId = getUserId();
    if (!userId) return;

    // 1) აუცილებლად გვქონდეს sessionId (თუ არ არის — შევქმნათ და სწორედ ის გამოვიყენოთ)
    let sessionId = activeId;
    if (!sessionId) {
      sessionId = await newChat();
    }
    if (!sessionId) return;

    // 2) გავაგზავნოთ user ტექსტი (backend თვითონ ჩაწერს user-ს და assistant-ს)
    const r = await fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ sessionId, role: "user", content: text }),
    });

    const j = await r.json();

    if (!j?.ok) return;

    const u = j?.userMessage;
    const a = j?.assistantMessage;

    // 3) UI-ში დავამატოთ ორივე მესიჯი
    setMessages((prev) => [
      ...prev,
      ...(u ? [{ id: u.id, role: u.role, content: u.content } as Msg] : []),
      ...(a ? [{ id: a.id, role: a.role, content: a.content } as Msg] : []),
    ]);

    // 4) Recents refresh (last_message_at შეიცვალა)
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  // აქ ვმართავთ active ჩატის შეცვლას წაშლისას
  const handleSessionDelete = (
    deletedId: string,
    fallbackId: string | null
  ) => {
    setActiveId((current) => {
      if (current === deletedId) return fallbackId;
      return current;
    });

    if (!fallbackId) {
      setMessages([]);
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
            setActiveId(id);
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
      <InputArea onSendMessage={sendMessage} />
    </div>
  );
};

export default Window;
