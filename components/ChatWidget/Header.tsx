import { Menu, Plus, ChevronDown } from "lucide-react";

interface HeaderProps {
  onClose?: () => void;
}

const Header = ({ onClose }: HeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] rounded-t-2xl border-b border-gray-100">
      {/* left part */}

      {/* middle part */}

      {/* right part */}
    </div>
  );
};

export default Header;
