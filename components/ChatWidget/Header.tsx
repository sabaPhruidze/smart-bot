import { Menu, Plus, ChevronDown } from "lucide-react";

interface HeaderProps {
  onClose?: () => void;
  onToggleDrawer?: () => void;
  onNewChat?: () => void;
}

const Header = ({ onClose, onToggleDrawer, onNewChat }: HeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] rounded-t-2xl border-b border-gray-100">
      {/* left part */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleDrawer}
          className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          aria-label="open recents"
        >
          <Menu size={20} />
        </button>
        <button
          className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          onClick={onNewChat}
          aria-label="New chat"
        >
          <Plus size={20} />
        </button>
      </div>
      {/* middle part */}
      <div className="flex items-center px-4 py-2 rounded-full">
        <span className="text-s font-semibold text-gray-800">Project Help</span>
      </div>
      {/* right part */}
      <div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          aria-label="Close chat"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
};

export default Header;
