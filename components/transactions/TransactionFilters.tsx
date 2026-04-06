"use client";

import type { AccountResponse, TransactionResponse } from "@/types/dashboard";
import type { TransactionFilters } from "@/lib/transactions";
import { DatePicker } from "@/components/ui/DatePicker";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

const TYPE_OPTIONS = [
  { value: "", label: "Todos os tipos" },
  { value: "INCOME", label: "Receitas" },
  { value: "EXPENSE", label: "Despesas" },
  { value: "TRANSFER", label: "Transferências" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500";

// ─── barra de filtros ──────────────────────────────────────────────────────────

interface TransactionFiltersBarProps {
  filters: TransactionFilters;
  accounts: AccountResponse[];
  onChange: (filters: TransactionFilters) => void;
  onClear: () => void;
}

export function TransactionFiltersBar({
  filters,
  accounts,
  onChange,
  onClear,
}: TransactionFiltersBarProps) {
  const hasAnyFilter =
    !!filters.accountId || !!filters.type || !!filters.startDate || !!filters.endDate;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* conta */}
        <select
          value={filters.accountId ?? ""}
          onChange={(e) => onChange({ ...filters, accountId: e.target.value || undefined })}
          className={inputClass}
          aria-label="Filtrar por conta"
        >
          <option value="">Todas as contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* tipo */}
        <select
          value={filters.type ?? ""}
          onChange={(e) => onChange({ ...filters, type: e.target.value || undefined })}
          className={inputClass}
          aria-label="Filtrar por tipo"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* data início */}
        <DatePicker
          value={filters.startDate}
          onChange={(iso) => onChange({ ...filters, startDate: iso })}
          placeholder="Data inicial"
        />

        {/* data fim */}
        <DatePicker
          value={filters.endDate}
          onChange={(iso) => onChange({ ...filters, endDate: iso })}
          placeholder="Data final"
        />
      </div>

      {hasAnyFilter && (
        <div className="flex justify-end">
          <button
            onClick={onClear}
            className="text-xs text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

// ─── resumo do período ─────────────────────────────────────────────────────────

interface PeriodSummaryProps {
  transactions: TransactionResponse[];
}

export function PeriodSummary({ transactions }: PeriodSummaryProps) {
  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const net = income - expense;
  const isNegative = net < 0;

  return (
    <div className="grid grid-cols-3 divide-x divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="px-5 py-4">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Entradas</p>
        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          + {formatCurrency(income)}
        </p>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Saídas</p>
        <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          – {formatCurrency(expense)}
        </p>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Balanço</p>
        <p className={`mt-1 text-sm font-medium ${isNegative ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-50"}`}>
          {isNegative ? "– " : "+ "}
          {formatCurrency(Math.abs(net))}
        </p>
      </div>
    </div>
  );
}

// ─── skeleton do resumo ────────────────────────────────────────────────────────

export function PeriodSummarySkeleton() {
  return (
    <div className="grid grid-cols-3 divide-x divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-5 py-4">
          <div className="h-3 w-14 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      ))}
    </div>
  );
}
