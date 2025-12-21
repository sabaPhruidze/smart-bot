"use client";

import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormValues } from "./loginSchema";

type LoginFormProps = {
  onSuccess: () => void;
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);

    try {
      const res = await axios.post("/api/auth/login", data);

      if (res.data?.ok) return onSuccess();

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
          className="w-full border rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800"
          {...register("identifier")}
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
          className="w-full border rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800"
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
        className="mt-2 w-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
