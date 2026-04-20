"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/lib/user";
import { OnboardingFlow } from "./OnboardingFlow";

type GateState = "checking" | "show" | "done";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    getMe()
      .then((user) => {
        setState(user.onboardingCompleted ? "done" : "show");
      })
      .catch(() => {
        // falha de rede — não bloqueia o usuário
        setState("done");
      });
  }, []);

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
      {children}
      {state === "show" && (
        <OnboardingFlow onComplete={() => setState("done")} />
      )}
    </>
  );
}
