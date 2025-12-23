import { useState } from "react";
import Header from "./Header";
import InputArea from "./InputArea";
import { User } from "lucide-react";
import Drawer from "./Drawer/Drawer";

interface WindowProps {
  onClose: () => void;
}
export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}
const Window = ({ onClose }: WindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };
  return (
    <div className="relative bg-white shadow-2xl flex flex-col border border-gray-100 overflow-hidden w-full h-full rounded-none sm:w-100 sm:h-150 sm:rounded-2xl sm:border sm:border-gray-100">
      <Header
        onClose={onClose}
        onToggleDrawer={() => setDrawerOpen((p) => !p)}
      />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="text-xs text-gray-600">
          Drawer content will be added in the next steps.
        </div>
      </Drawer>
      <div className="flex-1 bg-white p-6 overflow-y-auto">
        {messages.length === 0 ? (
          <h2 className="text-2xl font-light text-center text-gray-800 mt-8">
            How can I help?
          </h2>
        ) : (
          <div className="flex flex-col space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex shrink-0">
                    <img
                      src="/icon.png"
                      alt="Bot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[70%] text-sm shadow-sm wrap-break-word whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sender === "user" && (
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                    <User size={20} className="text-blue-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <InputArea onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Window;
