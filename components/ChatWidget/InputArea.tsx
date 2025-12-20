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
        <button></button>
      </div>
    </div>
  );
};

export default InputArea;
