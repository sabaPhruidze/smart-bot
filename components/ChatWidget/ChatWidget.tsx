"use client";

import { useEffect, useState } from "react";
import Launcher from "./Launcher";
import Window from "./Window";
import Login from "./Login/Login";
import {
  getIdentity,
  getOrCreateIdentity,
  setAuthedUser,
} from "./chatIdentity";

type Mode = "closed" | "login" | "chat";

const ChatWidget = () => {
  const [mode, setMode] = useState<Mode>("closed");
  const [isAuthed, setIsAuthed] = useState(false);

  const isOpen = mode !== "closed";

  useEffect(() => {
    const id = getIdentity();
    setIsAuthed(id?.kind === "user");
  }, []);

  const handleLauncherClick = () => {
    // თუ უკვე ავტორიზებულია → პირდაპირ ჩატი
    if (isAuthed) {
      setMode("chat");
      return;
    }
    // თუ არა → ჯერ Login გამოჩნდეს
    setMode("login");
  };

  const handleCloseAll = () => setMode("closed");

  const handleSkipLogin = () => {
    // guest identity შეიქმნება/ამოიღება და ჩატი გაიხსნება
    getOrCreateIdentity();
    setMode("chat");
  };

  const handleLoginSuccess = (user: { id: string; displayName: string }) => {
    setAuthedUser(user);
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
        <Login
          onClose={handleCloseAll}
          onSuccess={handleLoginSuccess}
          onSkip={handleSkipLogin}
        />
      )}

      {mode === "chat" && (
        <Window
          onClose={handleCloseAll}
          showSignIn={!isAuthed}
          onSignIn={() => setMode("login")}
        />
      )}
    </div>
  );
};

export default ChatWidget;
