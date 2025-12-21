import { ChevronDown } from "lucide-react";

type LoginheaderProps = {
  onClose: () => void;
};

const LoginHeader = ({ onClose }: LoginheaderProps) => {
  return (
    <div className="relative flex items-center px-4 py-3 bg-[#F9FAFB] border-b border-gray-100 rounded-t-2xl">
      {/* left */}
      <div className="flex items-center h-9">
        <div className="w-11 h-11 rounded-full overflow-hidden">
          <img
            src="/icon.png"
            alt="Symbol of the mseprinting website . this image consists pink,purple,orange and green colors and is a circle"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      {/* center */}
      <div className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-80">
        Sign in
      </div>
      {/* right */}
      <div className="ml-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
};

export default LoginHeader;
