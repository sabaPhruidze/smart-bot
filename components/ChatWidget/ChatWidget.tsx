import Launcher from "./Launcher";

const ChatWidget = () => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 sm:left-auto sm:translate-x-0 sm:right-6">
      <Launcher />
    </div>
  );
};

export default ChatWidget;
