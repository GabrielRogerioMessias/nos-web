"use client";

import { useState } from "react";
import { ArrowRightLeft, CreditCard, Landmark, Lock, Pencil, Trash2, Wallet } from "lucide-react";
import { DeleteTransactionModal } from "@/components/transactions/DeleteTransactionModal";
import { VaultReversalModal } from "@/components/transactions/VaultReversalModal";
import type { TransactionResponse, AccountResponse } from "@/types/dashboard";

function isVaultDescription(tx: TransactionResponse): boolean {
  const desc = tx.description?.toLowerCase() ?? "";
  return (
    desc.includes("cofre") ||
    (desc.includes("meta") && (desc.includes("guardado") || desc.includes("resgate") || desc.includes("depósito") || desc.includes("deposito")))
  );
}

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
    <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="h-3.5 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
            <div className="h-3.5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── indicador de origem ───────────────────────────────────────────────────────

function SourceBadge({ tx }: { tx: TransactionResponse }) {
  const isTransfer = tx.type === "TRANSFER";
  const isInvoiceLocked = tx.invoicePaid === true;

  if (isTransfer && !tx.category) {
    return (
      <span className="mt-0.5 flex items-center gap-1 text-xs text-zinc-300 dark:text-zinc-600">
        <ArrowRightLeft size={11} className="flex-shrink-0" />
        Movimentação
      </span>
    );
  }

  // linha de categoria + origem
  return (
    <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
      {/* categoria */}
      {tx.category?.name && (
        <span className="truncate">{tx.category.name}</span>
      )}

      {/* separador + origem */}
      {tx.creditCard ? (
        <>
          <span className="text-zinc-200 dark:text-zinc-700">·</span>
          <CreditCard size={11} className="flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
          <span className="truncate">{tx.creditCard.name}</span>
          {isInvoiceLocked && (
            <Lock size={10} className="flex-shrink-0 text-zinc-300 dark:text-zinc-600" />
          )}
        </>
      ) : tx.account ? (
        <>
          <span className="text-zinc-200 dark:text-zinc-700">·</span>
          {tx.type === "INCOME" ? (
            <Wallet size={11} className="flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
          ) : (
            <Landmark size={11} className="flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
          )}
          <span className="truncate">{tx.account.name}</span>
        </>
      ) : !tx.category?.name ? (
        <span>—</span>
      ) : null}
    </span>
  );
}

// ─── linha individual ──────────────────────────────────────────────────────────

interface TransactionRowProps {
  tx: TransactionResponse;
  readOnly?: boolean;
  onEdit: (tx: TransactionResponse) => void;
  onDeleteRequest: (tx: TransactionResponse) => void;
}

function TransactionRow({ tx, readOnly = false, onEdit, onDeleteRequest }: TransactionRowProps) {
  const isExpense = tx.type === "EXPENSE";
  const isTransfer = tx.type === "TRANSFER";

  // trava contábil por fatura paga (independente do readOnly global de conta arquivada)
  const isInvoiceLocked = tx.invoicePaid === true;
  // transações de cartão de crédito são somente-leitura no extrato (edição exige lógica de parcelas)
  const isCreditCardTx = !!tx.creditCard;
  // transações de cofre são gerenciadas pela tela de Cofres — sem ações no extrato
  // usa vaultId como fonte primária; fallback por descrição caso a API não retorne o campo
  const isVaultTx = !!tx.vaultId || isVaultDescription(tx);
  // parcelas de plano parcelado são geradas automaticamente — bloqueadas pelo back-end
  const isInstallmentTx = !!tx.installmentPlanId;
  // bloqueio sistêmico: qualquer transação gerenciada por outro subsistema
  const isSystemLocked = isVaultTx || isInstallmentTx;
  const isLocked = readOnly || isInvoiceLocked || isCreditCardTx || isSystemLocked;

  const amountColor = isExpense
    ? "text-zinc-500 dark:text-zinc-400"
    : isTransfer
    ? "text-zinc-400 dark:text-zinc-500"
    : "text-zinc-900 dark:text-zinc-50";

  return (
    <div className="flex items-center gap-2 px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
      {/* descrição + origem */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {tx.description}
        </span>
        <SourceBadge tx={tx} />
      </div>

      {/* valor + data + ações */}
      <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
        <span className={`whitespace-nowrap text-sm font-semibold tabular-nums ${amountColor}`}>
          {isExpense ? "– " : isTransfer ? "" : "+ "}
          {formatCurrency(tx.amount)}
        </span>
        <div className="flex items-center gap-0.5">
          <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
            {formatDate(tx.transactionDate)}
          </span>
          {isSystemLocked ? (
            <span className="p-1">
              <Lock size={12} className="text-zinc-300 dark:text-zinc-700" />
            </span>
          ) : !isLocked ? (
            <>
              <button
                onClick={() => onEdit(tx)}
                className="rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                aria-label="Editar transação"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDeleteRequest(tx)}
                className="rounded p-1 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                aria-label="Excluir transação"
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── lista ─────────────────────────────────────────────────────────────────────

interface TransactionListProps {
  transactions: TransactionResponse[];
  readOnly?: boolean;
  accounts?: AccountResponse[];
  onEdit: (tx: TransactionResponse) => void;
  onDeleteSuccess: (message: string) => void;
}

export function TransactionList({ transactions, readOnly = false, accounts = [], onEdit, onDeleteSuccess }: TransactionListProps) {
  const [pendingDelete, setPendingDelete] = useState<TransactionResponse | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Nenhuma transação encontrada.</p>
        {!readOnly && (
          <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">Clique em &quot;Nova transação&quot; para começar.</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            readOnly={readOnly}
            onEdit={onEdit}
            onDeleteRequest={setPendingDelete}
          />
        ))}
      </div>

      {pendingDelete && !pendingDelete.invoicePaid && !readOnly && (
        (!!pendingDelete.vaultId || isVaultDescription(pendingDelete)) ? (
          <VaultReversalModal
            tx={pendingDelete}
            accounts={accounts}
            onClose={() => setPendingDelete(null)}
            onSuccess={(message) => {
              setPendingDelete(null);
              onDeleteSuccess(message);
            }}
          />
        ) : (
          <DeleteTransactionModal
            tx={pendingDelete}
            onClose={() => setPendingDelete(null)}
            onSuccess={(message) => {
              setPendingDelete(null);
              onDeleteSuccess(message);
            }}
          />
        )
      )}
    </>
  );
}
