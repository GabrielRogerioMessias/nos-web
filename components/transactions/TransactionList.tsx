"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteTransactionModal } from "@/components/transactions/DeleteTransactionModal";
import type { TransactionResponse } from "@/types/dashboard";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// ─── skeleton ──────────────────────────────────────────────────────────────────

export function TransactionListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
            <div>
              <div className="h-3.5 w-36 animate-pulse rounded bg-zinc-200" />
              <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

// ─── linha individual ──────────────────────────────────────────────────────────

interface TransactionRowProps {
  tx: TransactionResponse;
  onEdit: (tx: TransactionResponse) => void;
  onDeleteRequest: (tx: TransactionResponse) => void;
}

function TransactionRow({ tx, onEdit, onDeleteRequest }: TransactionRowProps) {
  const isExpense = tx.type === "EXPENSE";
  const isTransfer = tx.type === "TRANSFER";

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      {/* data */}
      <span className="w-16 flex-shrink-0 text-xs tabular-nums text-zinc-400">
        {formatDate(tx.transactionDate)}
      </span>

      {/* descrição + conta */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-zinc-900">{tx.description}</span>
        <span className="truncate text-xs text-zinc-400">
          {tx.category?.name ?? "—"}
          {tx.account ? ` · ${tx.account.name}` : ""}
        </span>
      </div>

      {/* valor + ações */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <span
          className={`text-sm tabular-nums ${
            isExpense ? "text-zinc-500" : isTransfer ? "text-zinc-400" : "text-zinc-900"
          }`}
        >
          {isExpense ? "– " : isTransfer ? "" : "+ "}
          {formatCurrency(tx.amount)}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onEdit(tx)}
            className="rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500"
            aria-label="Editar transação"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDeleteRequest(tx)}
            className="rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500"
            aria-label="Excluir transação"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── lista ─────────────────────────────────────────────────────────────────────

interface TransactionListProps {
  transactions: TransactionResponse[];
  onEdit: (tx: TransactionResponse) => void;
  onDeleteSuccess: (message: string) => void;
}

export function TransactionList({ transactions, onEdit, onDeleteSuccess }: TransactionListProps) {
  const [pendingDelete, setPendingDelete] = useState<TransactionResponse | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center">
        <p className="text-sm text-zinc-400">Nenhuma transação encontrada.</p>
        <p className="mt-1 text-xs text-zinc-300">Clique em "Nova transação" para começar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            onEdit={onEdit}
            onDeleteRequest={setPendingDelete}
          />
        ))}
      </div>

      {pendingDelete && (
        <DeleteTransactionModal
          tx={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onSuccess={(message) => {
            setPendingDelete(null);
            onDeleteSuccess(message);
          }}
        />
      )}
    </>
  );
}
