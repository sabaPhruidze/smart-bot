import { Menu, Plus, ChevronDown } from "lucide-react";

interface HeaderProps {
  onClose?: () => void;
}

const Header = ({ onClose }: HeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] rounded-t-2xl border-b border-gray-100">
      {/* left part */}
      <div className="flex items-center gap-1">
        <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
          <Menu size={20} />
        </button>
        <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
          <Plus size={20} />
        </button>
      </div>
      {/* middle part */}
      <div className="flex items-center bg-gray-200/60 p-1 rounded-full">
        <button className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white rounded-full shadow-sm transition-all cursor-pointer">
          Project Help
        </button>
        <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
          Customize
        </button>
      </div>
      {/* right part */}
      <div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
};

export default Header;
