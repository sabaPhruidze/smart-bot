import { Send } from "lucide-react";

const InputArea = () => {
  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Send your message..."
          className="w-full py-3.5 px-5 text-md text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <button
          aria-label="Send message"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full text-white bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:opacity-90 hover:scale-105 transition-all shadow-md cursor-pointer"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default InputArea;
