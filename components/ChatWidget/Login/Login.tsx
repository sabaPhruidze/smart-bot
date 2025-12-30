"use client";

import LoginHeader from "./LoginHeader";
import LoginForm from "./LoginForm";

type LoginProps = {
  onClose: () => void;
  onSuccess: (user: { id: string; displayName: string }) => void;
  onSkip: () => void;
};

export default function Login({ onClose, onSuccess, onSkip }: LoginProps) {
  return (
    <div className="bg-white shadow-2xl flex flex-col border border-gray-100 overflow-hidden w-full h-full rounded-none sm:w-100 sm:h-130 sm:rounded-2xl">
      <LoginHeader onClose={onClose} />
      <LoginForm onSuccess={onSuccess} />

      <div className="px-6 pb-6 -mt-2">
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-sm text-gray-600 hover:text-gray-900 hover:underline cursor-pointer"
        >
          Skip for now — continue as guest
        </button>
      </div>
    </div>
  );
}
