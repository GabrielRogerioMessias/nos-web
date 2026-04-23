"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/lib/user";
import { OnboardingFlow } from "./OnboardingFlow";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastState } from "@/components/ui/useToastState";
import { getApiErrorMessage } from "@/lib/api-error";

type GateState = "checking" | "show" | "done";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, dismissToast } = useToastState();
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    getMe()
      .then((user) => {
        setState(user.onboardingCompleted ? "done" : "show");
      })
      .catch((error) => {
        // falha de rede — não bloqueia o usuário
        addToast(getApiErrorMessage(error, "Erro ao verificar onboarding. Tente novamente."), "error");
        setState("done");
      });
  }, [addToast]);

  if (state === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex w-full max-w-md animate-pulse flex-col gap-4 px-4">
          <div className="h-6 w-40 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {children}
      {state === "show" && (
        <OnboardingFlow onComplete={() => setState("done")} />
      )}
    </>
  );
}
