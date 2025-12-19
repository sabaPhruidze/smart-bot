import Launcher from "./Launcher";

const ChatWidget = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 ">
      <Launcher />
    </div>
  );
};

export default ChatWidget;
