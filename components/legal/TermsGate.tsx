"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { acceptTerms, getMe } from "@/lib/user";
import type { UserResponse } from "@/types/auth";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";

type GateState = "checking" | "accepted" | "blocked";

export function TermsGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [, setUser] = useState<UserResponse | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    getMe()
      .then((currentUser) => {
        setUser(currentUser);
        setState(currentUser.termsAccepted ? "accepted" : "blocked");
      })
      .catch(() => {
        setState("accepted");
      });
  }, []);

  useEffect(() => {
    if (state !== "blocked") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [state]);

  function addToast(message: string, type: ToastData["type"] = "success") {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  async function handleAcceptTerms() {
    setIsAccepting(true);
    try {
      await acceptTerms();
      setUser((currentUser) => currentUser ? { ...currentUser, termsAccepted: true } : currentUser);
      addToast("Termos aceitos com sucesso.");
      setState("accepted");
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao aceitar os termos. Tente novamente.", "error");
      setIsAccepting(false);
    }
  }

  if (state === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex w-full max-w-md animate-pulse flex-col gap-4 px-4">
          <div className="h-6 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-4 w-72 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-4 h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 md:p-8">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                nós. legal
              </p>
              <h1 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                Atualização nos Termos de Uso
              </h1>
              <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Para continuar usando o nós., por favor, leia e aceite nossos Termos de Uso e Política de Privacidade.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 text-sm sm:flex-row">
              <Link
                href="/termos-de-uso"
                target="_blank"
                className="rounded-lg border border-zinc-200 px-4 py-2 text-center text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Termos de Uso
              </Link>
              <Link
                href="/politica-de-privacidade"
                target="_blank"
                className="rounded-lg border border-zinc-200 px-4 py-2 text-center text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Política de Privacidade
              </Link>
            </div>

            <label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border border-zinc-200 p-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                disabled={isAccepting}
                className="mt-1 h-4 w-4 rounded border-zinc-300 accent-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:accent-zinc-100"
              />
              <span>
                Li e concordo com os Termos de Uso e a Política de Privacidade.
              </span>
            </label>

            <button
              type="button"
              onClick={handleAcceptTerms}
              disabled={!accepted || isAccepting}
              className="mt-6 w-full rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isAccepting ? "Aceitando..." : "Aceitar e Continuar"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {children}
    </>
  );
}
