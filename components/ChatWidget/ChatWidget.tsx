"use client";
import { useState } from "react";
import Launcher from "./Launcher";
import Window from "./Window";
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <div
      className={`fixed z-50 flex flex-col
        ${
          isOpen
            ? "inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:items-end"
            : "bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 items-center sm:items-end"
        }`}
    >
      {isOpen ? (
        <Window onClose={() => setIsOpen(false)} />
      ) : (
        <Launcher onClick={() => setIsOpen(true)} />
      )}
    </div>
  );
};

export default ChatWidget;
