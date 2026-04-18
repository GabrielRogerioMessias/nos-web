"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { deleteTransaction } from "@/lib/transactions";
import type { TransactionResponse, AccountResponse } from "@/types/dashboard";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

// Depósito no cofre → ao excluir, dinheiro VOLTA para a conta (saldo sobe)
// Resgate do cofre  → ao excluir, dinheiro SAI da conta (saldo desce)
function isVaultDeposit(tx: TransactionResponse): boolean {
  const desc = tx.description?.toLowerCase() ?? "";
  return (
    desc.includes("guardado no cofre") ||
    desc.includes("depósito no cofre") ||
    desc.includes("deposito no cofre") ||
    desc.includes("guardado na meta") ||
    desc.includes("depósito na meta") ||
    (tx.type === "EXPENSE" && (desc.includes("cofre") || desc.includes("meta")))
  );
}

interface Props {
  tx: TransactionResponse;
  accounts: AccountResponse[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function VaultReversalModal({ tx, accounts, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const account = accounts.find((a) => a.id === tx.account?.id);
  const currentBalance = Number(account?.currentBalance ?? 0);

  // depósito → exclusão devolve dinheiro → saldo sobe
  // resgate  → exclusão retira dinheiro  → saldo desce
  const isDeposit = isVaultDeposit(tx);
  const futureBalance = isDeposit
    ? currentBalance + tx.amount
    : currentBalance - tx.amount;

  const balanceGoesUp = futureBalance > currentBalance;

  async function handleConfirm() {
    setLoading(true);
    try {
      await deleteTransaction(tx.id);
      window.dispatchEvent(new CustomEvent("transaction-updated"));
      onSuccess("Transação estornada com sucesso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={!loading ? onClose : undefined} />

      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* cabeçalho */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
              <AlertTriangle size={17} className="text-amber-500" />
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Estornar transação do cofre
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Esta é uma transação de cofre. Ao excluí-la, o valor será revertido e o saldo da sua conta original será atualizado.
        </p>

        {/* caixa de impacto */}
        <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {account?.name ?? tx.account?.name ?? "Conta"}
          </p>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Saldo atual</span>
            <span className="text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Saldo após exclusão</span>
            <span className={`text-sm font-semibold tabular-nums ${
              balanceGoesUp
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}>
              {formatCurrency(futureBalance)}
            </span>
          </div>
        </div>

        {/* botões */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500/15 dark:hover:bg-red-500/25"
          >
            {loading ? "Estornando..." : "Sim, estornar valor"}
          </button>
        </div>
      </div>
    </>
  );
}
