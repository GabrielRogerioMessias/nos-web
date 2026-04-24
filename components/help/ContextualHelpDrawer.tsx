"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

interface HelpContent {
  title: string;
  paragraphs: string[];
}

const DEFAULT_HELP_CONTENT: HelpContent = {
  title: "Seu painel financeiro",
  paragraphs: [
    "Aqui você vê o resumo de tudo: saldo das contas, cartões e cofres.",
    "Saldo de Verdade é o valor que realmente sobra na sua conta depois de descontar o que já está comprometido com faturas e assinaturas. Se esse número está positivo, você tem folga. Se está negativo, cuidado — você está gastando mais do que tem disponível.",
    "Use o botão Nova transação pra registrar qualquer gasto, receita ou transferência.",
  ],
};

const HELP_CONTENT_BY_ROUTE: Record<string, HelpContent> = {
  "/": {
    title: "Seu painel financeiro",
    paragraphs: [
      "Aqui você vê o resumo de tudo: saldo das contas, cartões e cofres.",
      "Saldo de Verdade é o valor que realmente sobra na sua conta depois de descontar o que já está comprometido com faturas e assinaturas. Se esse número está positivo, você tem folga. Se está negativo, cuidado — você está gastando mais do que tem disponível.",
      "Use o botão Nova transação pra registrar qualquer gasto, receita ou transferência.",
    ],
  },
  "/extrato": {
    title: "Como funciona o extrato",
    paragraphs: [
      "Aqui aparecem todas as suas movimentações: receitas, despesas e transferências.",
      "Transferências entre suas próprias contas ou cofres não contam como receita nem despesa. Isso é intencional — mover R$ 500 da conta pro cofre não é um gasto, é uma reorganização do seu dinheiro. Por isso o total de Receitas vs Despesas do mês não muda.",
      "Use os filtros no topo pra ver por mês, categoria ou conta específica.",
    ],
  },
  "/cartoes": {
    title: "Como funcionam os cartões",
    paragraphs: [
      "Aqui você acompanha seus cartões de crédito, o ciclo de cada fatura e quanto deve.",
      "Fechamento é o dia em que o cartão para de somar compras naquela fatura. Vencimento é o dia em que você precisa pagar. Exemplo: fechamento dia 20, vencimento dia 10 — as compras de 21/março a 20/abril viram a fatura que vence em 10/maio.",
      "Na hora de pagar, você pode usar o saldo da conta ou o dinheiro que guardou no Cofre de Fatura. Se você separou direitinho no cofre, a fatura se paga sem surpresa.",
    ],
  },
  "/cofres": {
    title: "Como funcionam os cofres",
    paragraphs: [
      "Cofres são reservas separadas dentro da sua conta. O dinheiro que entra no cofre sai do seu saldo livre — é como separar um envelope.",
      "Cofre de Fatura: o mais importante. Cada vez que gastar no cartão, deposite o mesmo valor aqui. No fim do mês, use o cofre pra pagar a fatura inteira — sem susto.",
      "Cofre de Meta: vinculado a uma meta financeira (viagem, celular novo). O dinheiro fica guardado até você atingir o objetivo.",
      "Cofre Livre: reserva de emergência ou qualquer outro propósito. Sem regra, sem prazo.",
      "Todos os cofres rendem separadamente. O rendimento é seu — fica no cofre.",
    ],
  },
  "/assinaturas": {
    title: "Recorrências e parcelamentos",
    paragraphs: [
      "Assinaturas são cobranças que se repetem todo mês (Netflix, academia, aluguel). O app gera o lançamento automaticamente na data certa. Você pode pausar ou cancelar a qualquer momento.",
      "Parcelamentos são compras divididas (10x de R$ 100). Ao criar, o app gera todas as parcelas de uma vez como transações futuras. Você não precisa lançar uma por uma.",
      "Parcelas não podem ser editadas individualmente — se errou, cancele o parcelamento e crie de novo com os valores corretos.",
    ],
  },
  "/categorias": {
    title: "Organizando por categorias",
    paragraphs: [
      "Categorias ajudam você a entender pra onde vai seu dinheiro: Alimentação, Transporte, Lazer, Moradia...",
      "O app já vem com categorias padrão. Você pode criar as suas próprias (ex: \"Freelas\", \"Pet\", \"Presente pro crush\"). Categorias padrão não podem ser editadas nem excluídas.",
      "Toda transação pode ter uma categoria. No extrato, você consegue filtrar por categoria pra ver quanto gastou em cada uma.",
    ],
  },
  "/metas": {
    title: "Como funcionam as metas",
    paragraphs: [
      "Metas são objetivos com valor e prazo: \"Juntar R$ 5.000 pra viagem até dezembro.\"",
      "Ao criar uma meta, o app cria um cofre vinculado automaticamente. Todo depósito nesse cofre conta como progresso. Você acompanha quanto falta e quando vai atingir no ritmo atual.",
      "O dinheiro da meta fica protegido no cofre — não se mistura com o saldo livre da sua conta. E rende separadamente.",
    ],
  },
  "/goals": {
    title: "Como funcionam as metas",
    paragraphs: [
      "Metas são objetivos com valor e prazo: \"Juntar R$ 5.000 pra viagem até dezembro.\"",
      "Ao criar uma meta, o app cria um cofre vinculado automaticamente. Todo depósito nesse cofre conta como progresso. Você acompanha quanto falta e quando vai atingir no ritmo atual.",
      "O dinheiro da meta fica protegido no cofre — não se mistura com o saldo livre da sua conta. E rende separadamente.",
    ],
  },
};

function resolveHelpContent(pathname: string): HelpContent {
  const matchedRoute = Object.keys(HELP_CONTENT_BY_ROUTE).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  return matchedRoute ? HELP_CONTENT_BY_ROUTE[matchedRoute] : DEFAULT_HELP_CONTENT;
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
      if (event.key === "Escape") setOpen(false);
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
              <h2 id="contextual-help-title" className="mb-4 text-lg font-medium tracking-tight text-zinc-100">
                {helpContent.title}
              </h2>
              <div className="space-y-4">
                {helpContent.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-zinc-400">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
