import { useState } from "react";
import Header from "./Header";
import InputArea from "./InputArea";

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
    <div className="bg-white shadow-2xl flex flex-col border border-gray-100 overflow-hidden w-full h-full rounded-none sm:w-[400px] sm:h-[600px] sm:rounded-2xl sm:border sm:border-gray-100">
      <Header onClose={onClose} />
      <div className="flex-1 bg-white p-6">
        {messages.length === 0 ? (
          <h2 className="text-2xl font-light text-center text-gray-800 mt-8">
            How can I help?
          </h2>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((msg: Message) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg max-w-[80%] text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-100 text-blue-900 self-end rounded-br-none"
                    : "bg-gray-100 text-gray-800 self-start rounded-bl-none"
                }`}
              >
                {msg.text}
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
