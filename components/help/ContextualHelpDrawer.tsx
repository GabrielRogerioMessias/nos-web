"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

interface HelpContent {
  title: string;
  description: string;
}

const DEFAULT_HELP_CONTENT: HelpContent = {
  title: "Bem-vindo ao nos.",
  description:
    "Bem-vindo ao nós. Navegue pelo menu para ter controle total sobre seu patrimônio. Utilize o botão 'Nova transação' a qualquer momento para registrar movimentações.",
};

const HELP_CONTENT_BY_ROUTE: Record<string, HelpContent> = {
  "/cofres": {
    title: "Entenda seus Cofres",
    description:
      "Entenda seus Cofres. O Cofre Livre guarda sua reserva. O Cofre de Fatura separa o dinheiro do cartão. Metas focam em objetivos com data. Lembre-se: ao depositar, o valor sai do saldo livre da sua conta.",
  },
  "/cartoes": {
    title: "Controle de Cartões",
    description:
      "Controle de Cartões. O sistema acompanha seu dia de fechamento e vencimento. Quando a fatura fechar, você pode pagá-la usando o saldo da sua conta principal ou o dinheiro guardado em um Cofre de Fatura.",
  },
  "/extrato": {
    title: "Seu Histórico",
    description:
      "Seu Histórico. Aqui você vê todas as movimentações. Note que transações do tipo 'Transferência' entre suas próprias contas ou cofres não alteram o cálculo total de Receitas vs Despesas do mês.",
  },
  "/assinaturas": {
    title: "Pagamentos Recorrentes",
    description:
      "Pagamentos Recorrentes. O sistema prevê e debita automaticamente suas assinaturas ativas na data certa. Você também pode adiantar um pagamento ou pausar uma recorrência a qualquer momento.",
  },
  "/metas": {
    title: "Metas Financeiras",
    description:
      "Metas Financeiras. Todo o dinheiro alocado aqui fica protegido em um cofre especial e rende separadamente. Acompanhe a projeção para saber quando você atingirá seu objetivo.",
  },
  "/goals": {
    title: "Metas Financeiras",
    description:
      "Metas Financeiras. Todo o dinheiro alocado aqui fica protegido em um cofre especial e rende separadamente. Acompanhe a projeção para saber quando você atingirá seu objetivo.",
  },
};

function resolveHelpContent(pathname: string): HelpContent {
  const matchedRoute = Object.keys(HELP_CONTENT_BY_ROUTE).find((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!matchedRoute) {
    return DEFAULT_HELP_CONTENT;
  }

  return HELP_CONTENT_BY_ROUTE[matchedRoute];
}

export function ContextualHelpDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const helpContent = useMemo(() => resolveHelpContent(pathname), [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-4 w-4 translate-y-px items-center justify-center rounded-full border border-zinc-300/70 text-[10px] font-medium leading-none text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700/70 dark:text-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
        aria-label="Abrir ajuda contextual"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-[999]">
          <button
            type="button"
            aria-label="Fechar ajuda contextual"
            className="fixed inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contextual-help-title"
            className="absolute inset-x-0 bottom-0 flex max-h-[68dvh] flex-col rounded-t-3xl border-t border-zinc-800/50 bg-zinc-950 md:left-1/2 md:top-1/2 md:bottom-auto md:max-h-[82dvh] md:w-[calc(100%-2rem)] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-zinc-800"
          >
            <div className="flex justify-center px-6 pt-4 md:hidden">
              <span className="h-1 w-10 rounded-full bg-zinc-700" />
            </div>

            <div className="flex items-center justify-between px-6 pb-2 pt-5 md:px-8 md:pt-8">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">
                Ajuda contextual
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                aria-label="Fechar ajuda contextual"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-12 pt-4 md:px-8 md:pb-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 id="contextual-help-title" className="text-lg font-medium tracking-tight text-zinc-100">
                    {helpContent.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {helpContent.description}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-zinc-500">
                  Esta ajuda acompanha a tela em que você está para manter a navegação leve, direta e sem interromper seu fluxo.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
