"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { acceptTerms, getMe } from "@/lib/user";
import type { UserResponse } from "@/types/auth";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastState } from "@/components/ui/useToastState";

type GateState = "checking" | "accepted" | "blocked";

export function TermsGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [, setUser] = useState<UserResponse | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const { toasts, addToast, dismissToast } = useToastState();

  useEffect(() => {
    getMe()
      .then((currentUser) => {
        setUser(currentUser);
        setState(currentUser.termsAccepted ? "accepted" : "blocked");
      })
      .catch((error) => {
        const msg = (error as AxiosError<{ message?: string }>)?.response?.data?.message;
        addToast(msg ?? "Erro ao verificar aceite dos termos. Tente novamente.", "error");
        setState("accepted");
      });
  }, [addToast]);

  useEffect(() => {
    if (state !== "blocked") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [state]);

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

            <div className="mt-6 max-h-60 space-y-5 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 p-4 pr-3 [scrollbar-color:theme(colors.zinc.300)_transparent] [scrollbar-width:thin] dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:[scrollbar-color:theme(colors.zinc.700)_transparent]">
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  Termos de Uso
                </h2>
                <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer finibus, massa sed tempor gravida, justo sem fermentum nibh, non facilisis sem velit vitae arcu. Sed vitae lectus vel justo luctus posuere. Donec vitae neque in nunc blandit vulputate.
                </p>
                <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                  Praesent commodo, nibh at viverra tincidunt, lorem arcu placerat urna, sed convallis justo magna non lectus. Curabitur vitae urna id neque aliquet posuere. Nulla facilisi. Suspendisse potenti.
                </p>
              </section>

              <section className="space-y-2 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  Política de Privacidade
                </h2>
                <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis non elit sed metus luctus efficitur. Aliquam erat volutpat. Morbi ac justo a nisl cursus suscipit sed at risus. Vivamus vel sapien nec arcu faucibus dignissim.
                </p>
                <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                  Fusce sed mi a enim aliquam luctus. Maecenas at libero ac lectus tincidunt porttitor. Etiam at urna ac nibh pharetra ullamcorper. Donec non massa non justo tincidunt gravida.
                </p>
              </section>
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
