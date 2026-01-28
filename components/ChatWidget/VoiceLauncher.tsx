import { Mic } from "lucide-react";

interface VoiceLauncherProps {
  onClick: () => void;
}

const VoiceLauncher = ({ onClick }: VoiceLauncherProps) => {
  return (
    <button
      onClick={onClick}
      aria-label="Start voice"
      className="
        flex h-24 w-24 items-center justify-center
        rounded-full
        bg-black/80 text-white
        shadow-lg
        transition-transform hover:scale-110
        cursor-pointer
      "
    >
      <Mic size={34} />
    </button>
  );
};

export default VoiceLauncher;
