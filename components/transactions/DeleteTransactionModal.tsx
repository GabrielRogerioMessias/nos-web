"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { deleteTransaction } from "@/lib/transactions";
import { deleteInstallmentPlan } from "@/lib/credit-cards";
import { deleteRecurringTransaction } from "@/lib/recurring-transactions";
import type { TransactionResponse } from "@/types/dashboard";

interface DeleteTransactionModalProps {
  tx: TransactionResponse;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type Scenario = "normal" | "installment" | "recurring";

function getScenario(tx: TransactionResponse): Scenario {
  if (tx.installmentPlanId) return "installment";
  if (tx.recurringTransactionId) return "recurring";
  return "normal";
}

export function DeleteTransactionModal({ tx, onClose, onSuccess }: DeleteTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const scenario = getScenario(tx);

  async function run(action: () => Promise<void>, message: string) {
    setLoading(true);
    try {
      await action();
      window.dispatchEvent(new CustomEvent("transaction-updated"));
      onSuccess(message);
    } finally {
      setLoading(false);
    }
  }

  function deleteOnly() {
    run(() => deleteTransaction(tx.id), "Transação excluída.");
  }

  function cancelPlan() {
    run(
      () => deleteInstallmentPlan(tx.installmentPlanId!),
      "Parcelamento cancelado."
    );
  }

  function cancelRecurring() {
    run(
      () => deleteRecurringTransaction(tx.recurringTransactionId!),
      "Recorrência cancelada."
    );
  }

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 z-50 bg-black/20" onClick={!loading ? onClose : undefined} />

      {/* painel */}
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {scenario === "normal" && (
              <>
                <p className="text-sm font-medium text-zinc-900">Excluir transação</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Tem certeza que deseja excluir <span className="font-medium text-zinc-700">"{tx.description}"</span>? Esta ação não pode ser desfeita.
                </p>
              </>
            )}

            {scenario === "installment" && (
              <>
                <p className="text-sm font-medium text-zinc-900">Compra parcelada</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Esta transação faz parte de uma compra parcelada. Por segurança contábil, não é possível excluir parcelas individuais. Deseja cancelar a compra inteira e remover todas as parcelas?
                </p>
              </>
            )}

            {scenario === "recurring" && (
              <>
                <p className="text-sm font-medium text-zinc-900">Transação fixa/recorrente</p>
                <p className="mt-1 text-sm text-zinc-500">
                  <span className="font-medium text-zinc-700">"{tx.description}"</span> é uma transação fixa/recorrente. O que deseja fazer?
                </p>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex-shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* botões */}
        <div className="flex flex-col gap-2">
          {scenario === "normal" && (
            <>
              <button
                onClick={deleteOnly}
                disabled={loading}
                className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "Excluindo..." : "Excluir"}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
              >
                Cancelar
              </button>
            </>
          )}

          {scenario === "installment" && (
            <>
              <button
                onClick={cancelPlan}
                disabled={loading}
                className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "Processando..." : "Cancelar Parcelamento Completo"}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
              >
                Cancelar
              </button>
            </>
          )}

          {scenario === "recurring" && (
            <>
              <button
                onClick={deleteOnly}
                disabled={loading}
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                {loading ? "Processando..." : "Excluir SÓ este lançamento"}
              </button>
              <button
                onClick={cancelRecurring}
                disabled={loading}
                className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "Processando..." : "Cancelar Assinatura"}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
