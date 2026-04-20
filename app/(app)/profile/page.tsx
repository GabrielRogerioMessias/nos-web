"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";
import { getMe } from "@/lib/user";
import { api } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import type { UserResponse } from "@/types/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function Avatar({ user }: { user: UserResponse }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="h-20 w-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
      />
    );
  }
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
      <span className="text-xl font-medium text-zinc-600 select-none dark:text-zinc-300">
        {getInitials(user.name)}
      </span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-center gap-4 pb-8 border-b border-zinc-100 dark:border-zinc-800">
        <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-5 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <div className="h-3.5 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const addToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  }, []);

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleResendVerification() {
    setIsResending(true);
    try {
      await api.post("/auth/resend-verification");
      addToast("E-mail enviado! Verifique sua caixa de entrada.");
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao enviar e-mail. Tente novamente.", "error");
    } finally {
      setIsResending(false);
    }
  }

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <div className="max-w-md">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <h1 className="mb-8 text-xl font-medium text-zinc-900 dark:text-zinc-50">Perfil</h1>

      {loading ? (
        <ProfileSkeleton />
      ) : user ? (
        <>
          <div className="flex flex-col items-center gap-3 pb-8 border-b border-zinc-100 dark:border-zinc-800">
            <Avatar user={user} />
            <div className="text-center">
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">{user.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
                Nome
              </label>
              <input
                type="text"
                value={user.name}
                disabled
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
                E-mail
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              />
              {user.emailVerified ? (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-500" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-500">E-mail verificado</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-amber-500 dark:text-amber-400" />
                    <span className="text-xs text-amber-600 dark:text-amber-400">E-mail não verificado</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-fit text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    {isResending ? "Enviando..." : "Reenviar e-mail de verificação"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 border-t border-zinc-100 pt-8 dark:border-zinc-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">Aparência</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 hover:border-red-100 dark:border-zinc-700 dark:hover:bg-red-950/40 dark:hover:border-red-900"
            >
              <LogOut size={15} strokeWidth={1.5} />
              Sair da conta
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Não foi possível carregar o perfil.</p>
      )}
    </div>
  );
}
