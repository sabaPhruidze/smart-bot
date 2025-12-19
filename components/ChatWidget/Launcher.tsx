interface LauncherProps {
  onClick: () => void;
}

const Launcher = ({ onClick }: LauncherProps) => {
  return (
    <button
      onClick={onClick}
      aria-label="Open chat"
      className="
        flex h-24 w-24 items-center justify-center 
        rounded-full
        text-white 
        transition-transform hover:scale-110 
         cursor-pointer overflow-hidden"
    >
      <img
        src="/icon.png"
        alt="Symbol of the mseprinting website . this image consists pink,purple,orange and green colors and is a circle"
        className="w-full h-full"
      />
    </button>
  );
};

export default Launcher;
