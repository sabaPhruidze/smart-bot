"use client";
import { useState } from "react";
import Launcher from "./Launcher";
import Window from "./Window";
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 sm:left-auto sm:translate-x-0 sm:right-6">
      {isOpen ? <Window /> : <Launcher onClick={() => setIsOpen(true)} />}
    </div>
  );
};

export default ChatWidget;
