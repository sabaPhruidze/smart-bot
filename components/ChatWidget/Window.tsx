import Header from "./Header";
import InputArea from "./InputArea";
interface WindowProps {
  onClose: () => void;
}
const Window = ({ onClose }: WindowProps) => {
  return (
    <div className="bg-white shadow-2xl flex flex-col border border-gray-100 overflow-hidden w-full h-full rounded-none sm:w-[400px] sm:h-[600px] sm:rounded-2xl sm:border sm:border-gray-100">
      <Header onClose={onClose} />
      <div className="flex-1 bg-white p-6">
        <h2 className="text-2xl font-light text-center text-gray-800 mt-8">
          How can I help?
        </h2>
      </div>
      <InputArea />
    </div>
  );
};

export default Window;
