"use client";

import { useEffect, useState } from "react";
import Launcher from "./Launcher";
import Window from "./Window";
import Login from "./Login/Login";

type Mode = "closed" | "login" | "chat";

const ChatWidget = () => {
  const [mode, setMode] = useState<Mode>("closed");
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  const isOpen = mode !== "closed";

  const handleLauncherClick = () => {
    if (isAuthed) {
      setMode("chat");
    } else {
      setMode("login");
    }
  };

  const handleClose = () => setMode("closed");

  useEffect(() => {
    const flag = localStorage.getItem("chat_authed");
    if (flag === "1") setIsAuthed(true);
  }, []);
  const handleLoginSuccess = (user: { id: string; displayName: string }) => {
    localStorage.setItem("chat_authed", "1");
    localStorage.setItem("chat_user", JSON.stringify(user));

    setIsAuthed(true);
    setMode("chat");
  };

  return (
    <div
      className={`fixed z-50 flex flex-col ${
        isOpen
          ? "inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:items-end"
          : "bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 items-center sm:items-end"
      }`}
    >
      {mode === "closed" && <Launcher onClick={handleLauncherClick} />}

      {mode === "login" && (
        <Login onClose={handleClose} onSuccess={handleLoginSuccess} />
      )}

      {mode === "chat" && <Window onClose={handleClose} />}
    </div>
  );
};

export default ChatWidget;
