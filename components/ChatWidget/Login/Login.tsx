"use client";

import LoginHeader from "./LoginHeader";
import LoginForm from "./LoginForm";

type LoginProps = {
  onClose: () => void;
  onSuccess: (user: { id: string; displayName: string }) => void;
};

export default function Login({ onClose, onSuccess }: LoginProps) {
  return (
    <div className="bg-white shadow-2xl flex flex-col border border-gray-100 overflow-hidden w-full h-full rounded-none sm:w-[400px] sm:h-[520px] sm:rounded-2xl">
      <LoginHeader onClose={onClose} />
      <LoginForm onSuccess={onSuccess} />
    </div>
  );
}
