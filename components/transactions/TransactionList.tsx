"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
  onDelete: (id: string) => Promise<void>;
}

function TransactionRow({ tx, onEdit, onDelete }: TransactionRowProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isExpense = tx.type === "EXPENSE";
  const isTransfer = tx.type === "TRANSFER";

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await onDelete(tx.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

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
            isExpense
              ? "text-zinc-500"
              : isTransfer
              ? "text-zinc-400"
              : "text-zinc-900"
          }`}
        >
          {isExpense ? "– " : isTransfer ? "" : "+ "}
          {formatCurrency(tx.amount)}
        </span>

        {/* ações normais */}
        {!confirming && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onEdit(tx)}
              className="rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* estado de confirmação inline */}
        {confirming && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500">Excluir?</span>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="rounded px-2 py-0.5 font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "..." : "Sim"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded px-2 py-0.5 text-zinc-400 hover:bg-zinc-100"
            >
              Não
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── lista ─────────────────────────────────────────────────────────────────────

interface TransactionListProps {
  transactions: TransactionResponse[];
  onEdit: (tx: TransactionResponse) => void;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center">
        <p className="text-sm text-zinc-400">Nenhuma transação encontrada.</p>
        <p className="mt-1 text-xs text-zinc-300">Clique em "Nova transação" para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
