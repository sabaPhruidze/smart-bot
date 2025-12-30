import { User } from "lucide-react";
import { motion } from "framer-motion";
export type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status?: "sending" | "typing";
};

const TypingDots = () => {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
};

const MessagesArea = ({ messages }: { messages: Msg[] }) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 bg-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-light text-center text-gray-800 mt-8">
          How can I help?
        </h2>
      </div>
    );
  }
  return (
    <div className="flex-1 bg-white p-6 overflow-y-auto">
      <div className="flex flex-col space-y-6">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-12 h-12 rounded-full overflow-hidden flex shrink-0">
                  <img
                    src="/icon.png"
                    alt="Bot"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                className={`p-3 rounded-2xl max-w-[70%] text-sm shadow-sm whitespace-pre-wrap ${
                  isUser
                    ? "bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200"
                }`}
              >
                {m.status === "typing" ? <TypingDots /> : m.content}
              </div>

              {isUser && (
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                  <User size={20} className="text-blue-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessagesArea;
