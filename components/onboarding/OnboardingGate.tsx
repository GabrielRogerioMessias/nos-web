"use client";

import { useEffect, useState } from "react";
import { getAccounts } from "@/lib/accounts";
import { getCreditCards } from "@/lib/credit-cards";
import { getVaults } from "@/lib/vaults";
import { OnboardingFlow } from "./OnboardingFlow";

type OnboardingState =
  | { status: "checking" }
  | { status: "done" }
  | { status: "show"; step: 1 | 2 | 3; accountId?: string; cardName?: string };

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>({ status: "checking" });

  useEffect(() => {
    async function check() {
      try {
        const [accounts, cards, vaults] = await Promise.all([
          getAccounts(),
          getCreditCards(),
          getVaults(),
        ]);

        const hasConta = accounts.length > 0;
        const hasCartao = cards.length > 0;
        const hasCofreDeInvoice = vaults.some((v) => v.vaultType === "INVOICE");

        if (!hasConta) {
          setState({ status: "show", step: 1 });
          return;
        }
        if (!hasCartao) {
          setState({ status: "show", step: 2, accountId: accounts[0].id });
          return;
        }
        if (!hasCofreDeInvoice) {
          setState({
            status: "show",
            step: 3,
            accountId: accounts[0].id,
            cardName: cards[0].name,
          });
          return;
        }

        setState({ status: "done" });
      } catch {
        // falha de rede — não bloqueia o usuário
        setState({ status: "done" });
      }
    }

    check();
  }, []);

  // enquanto verifica, exibe skeleton neutro sobre o conteúdo
  if (state.status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col gap-4 w-full max-w-md animate-pulse px-4">
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
      {state.status === "show" && (
        <OnboardingFlow
          initialStep={state.step}
          prefilledAccountId={state.accountId}
          prefilledCardName={state.cardName}
          onComplete={() => setState({ status: "done" })}
        />
      )}
    </>
  );
}
