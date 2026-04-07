"use client";

import { useEffect, useRef, useState } from "react";
import { X, ArrowDownCircle, ArrowUpCircle, Sparkles } from "lucide-react";
import { getVaultTransactions, type VaultResponse, type VaultTransaction } from "@/lib/vaults";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  vault: VaultResponse;
  onClose: () => void;
}

export function VaultStatementSheet({ vault, onClose }: Props) {
  const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    getVaultTransactions(vault.id, page)
      .then((res) => {
        const sorted = [...res.content].sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
        );
        setTransactions((prev) => (page === 0 ? sorted : [...prev, ...sorted]));
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [vault.id, page]);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/30"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Extrato do cofre</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{vault.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* balance pill */}
        <div className="mx-5 mt-4 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Saldo atual</p>
          <p className="mt-0.5 text-base font-medium text-zinc-900 dark:text-zinc-50">
            {formatCurrency(vault.currentBalance)}
          </p>
        </div>

        {/* timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && page === 0 ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                  <div className="h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma movimentação ainda.</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Faça um depósito para começar a guardar.
              </p>
            </div>
          ) : (
            <div className="relative flex flex-col gap-0">
              {/* vertical line */}
              <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-px bg-zinc-100 dark:bg-zinc-800" />

              {transactions.map((tx) => {
                const config =
                  tx.type === "DEPOSIT"
                    ? {
                        label: "Depósito",
                        icon: <ArrowDownCircle size={15} className="text-emerald-500" />,
                        bg: "bg-emerald-50 dark:bg-emerald-950/50",
                        amountClass: "text-emerald-600 dark:text-emerald-400",
                        sign: "+",
                      }
                    : tx.type === "YIELD"
                    ? {
                        label: "Rendimento",
                        icon: <Sparkles size={15} className="text-blue-500" />,
                        bg: "bg-blue-50 dark:bg-blue-950/50",
                        amountClass: "text-blue-600 dark:text-blue-400",
                        sign: "+",
                      }
                    : {
                        label: "Resgate",
                        icon: <ArrowUpCircle size={15} className="text-rose-500" />,
                        bg: "bg-rose-50 dark:bg-rose-950/50",
                        amountClass: "text-rose-500 dark:text-rose-400",
                        sign: "-",
                      };

                return (
                  <div key={tx.id} className="relative flex items-start gap-3 py-3">
                    {/* icon dot */}
                    <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                      {config.icon}
                    </div>

                    {/* content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {config.label}
                      </p>
                      {tx.description && (
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {tx.description}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {formatDate(tx.transactionDate)}
                        {tx.account ? ` · ${tx.account.name}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        Saldo após: {formatCurrency(tx.balanceAfter)}
                      </p>
                    </div>

                    {/* amount */}
                    <p className={`flex-shrink-0 text-sm font-medium ${config.amountClass}`}>
                      {config.sign}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                );
              })}

              {/* load more */}
              {page + 1 < totalPages && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="mt-2 w-full rounded-lg py-2.5 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {loading ? "Carregando..." : "Carregar mais"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
