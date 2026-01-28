"use client";

import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormValues } from "./loginSchema";

type LoginFormProps = {
  onSuccess: (user: { id: string; displayName: string }) => void;
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue, // for identifier
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const handleRegisterClick = () => {
    window.open("https://www.mseprinting.com/register", "_blank", "noopener,noreferrer");
  };
  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);

    try {
      const res = await axios.post("/api/auth/login", data);

      if (res.data?.ok && res.data?.user) {
        return onSuccess(res.data.user);
      }

      setServerError(
        res.data?.error ||
          "The email/phone or password you entered is incorrect. Please try again."
      );
    } catch (err: any) {
      setServerError(
        err?.response?.data?.error ||
          "We couldn’t sign you in right now. Please try again in a moment."
      );
    }
  };
  const [idMode, setIdMode] = useState<"unknown" | "phone" | "email">(
    "unknown"
  );
  const identifierReg = register("identifier");
  const formatUSPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10); // max 10 digits
    const a = digits.slice(0, 3);
    const b = digits.slice(3, 6);
    const c = digits.slice(6, 10);

    if (digits.length <= 3) return a;
    if (digits.length <= 6) return `${a}-${b}`;
    return `${a}-${b}-${c}`;
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex-1 p-6 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <input
          type="text"
          placeholder="Email or phone (444-444-4444)"
          autoComplete="username"
          className="w-full py-3.5 px-5 text-md text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          {...identifierReg}
          onChange={(e) => {
            // 1) ჯერ RHF-ს მივაწოდოთ event
            identifierReg.onChange(e);
            const raw = e.target.value;
            // თუ მთლიანად წაიშალა — reset რეჟიმი
            if (raw.trim() === "") {
              setIdMode("unknown");
              return;
            }
            const firstChar = raw.trim()[0];
            const firstIsDigit = !!firstChar && /\d/.test(firstChar);
            // effectiveMode: ერთხელ თუ phone გახდა, მერე აღარ გადავდივართ email-ზე (სანამ არ წაიშლება)
            const effectiveMode =
              idMode === "unknown"
                ? firstIsDigit
                  ? "phone"
                  : "email"
                : idMode;
            if (idMode === "unknown") setIdMode(effectiveMode);
            // phone mode — forced formatting + max length
            if (effectiveMode === "phone") {
              const formatted = formatUSPhone(raw);
              // setValue ძალით ჩაწერს სწორ ფორმატს და ზედმეტს ვერ შეიყვანს
              setValue("identifier", formatted, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        />
        {errors.identifier && (
          <p className="text-red-600 text-xs">
            {String(errors.identifier.message)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          className="w-full py-3.5 px-5 text-md text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-red-600 text-xs">
            {String(errors.password.message)}
          </p>
        )}
      </div>
      {serverError && (
        <p className="text-red-600 text-sm text-center">{serverError}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full rounded-full bg-linear-to-r from-pink-500 via-purple-500 to-orange-500 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
       <button
        type="button"
        onClick={handleRegisterClick}
        className="w-full rounded-full bg-linear-to-r from-pink-500 via-purple-500 to-orange-500 py-3 font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
      >
        Register
      </button>
    </form>
  );
}
