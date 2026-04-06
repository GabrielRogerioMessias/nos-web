"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import {
  getIncomeVsExpense,
  getAccounts,
  getCashflow,
  getMonthlySummary,
  type CashflowResponse,
  type MonthlySummaryResponse,
} from "@/lib/dashboard";
import { getAccountBalance } from "@/lib/accounts";
import { getTransactions } from "@/lib/transactions";
import { getMe } from "@/lib/user";
import { useTransactionForm } from "@/components/transactions/TransactionContext";
import {
  IncomeVsExpenseChart,
  IncomeVsExpenseChartSkeleton,
} from "@/components/charts/IncomeVsExpenseChart";
import {
  ExpenseByCategoryChart,
  ExpenseByCategoryChartSkeleton,
} from "@/components/charts/ExpenseByCategoryChart";
import type {
  IncomeVsExpenseResponse,
  AccountResponse,
  TransactionResponse,
} from "@/types/dashboard";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string) {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function currentMonthIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthLabel() {
  return new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

// ─── skeletons ────────────────────────────────────────────────────────────────

function BalanceSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 h-10 w-52 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="my-5 border-t border-zinc-100 dark:border-zinc-800" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-2 h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div>
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="mt-2 h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <div>
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="h-3 w-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div>
                <div className="h-3.5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── planning card ────────────────────────────────────────────────────────────

function PlanningCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
        <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}

function PlanningCard({ data }: { data: CashflowResponse }) {
  const isFreeNegative = data.freeBalance < 0;
  const saved = data.savedForInvoices ?? 0;
  // valor efetivamente ainda devido após o cofre de fatura; nunca negativo na exibição
  const netInvoices = Math.max(0, data.committedInvoices - saved);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Saldo Livre</p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Saldo atual</span>
          <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-300">{formatCurrency(data.currentBalance)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">(-) Contas fixas</span>
          <span className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">– {formatCurrency(data.committedRecurring)}</span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">(-) Faturas de cartão</span>
            {saved > 0 && (
              <span className="mt-0.5 text-xs text-emerald-500 dark:text-emerald-400">
                {formatCurrency(saved)} guardados no cofre
              </span>
            )}
          </div>
          <span className="flex-shrink-0 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
            – {formatCurrency(netInvoices)}
          </span>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">= Saldo livre</span>
          <span className={`text-base font-semibold tabular-nums ${isFreeNegative ? "text-red-500" : "text-emerald-500"}`}>
            {formatCurrency(data.freeBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── transações recentes ──────────────────────────────────────────────────────

function RecentTransactions({ transactions }: { transactions: TransactionResponse[] }) {
  if (transactions.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Transações recentes</p>
        <Link
          href="/extrato?from=dash"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Ver todas <ChevronRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {transactions.map((tx) => {
          const isExpense = tx.type === "EXPENSE";
          const isTransfer = tx.type === "TRANSFER";
          return (
            <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4">
                <span className="w-10 flex-shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                  {formatDate(tx.transactionDate)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">{tx.description}</p>
                  <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">{tx.category?.name ?? "—"}</p>
                </div>
              </div>
              <span className={`flex-shrink-0 text-sm tabular-nums ${
                isExpense ? "text-zinc-500 dark:text-zinc-400" : isTransfer ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-50"
              }`}>
                {isExpense ? "– " : isTransfer ? "" : "+ "}
                {formatCurrency(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── página ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { openTransactionForm } = useTransactionForm();
  const [userName, setUserName] = useState<string | null>(null);
  const [cashflow, setCashflow] = useState<CashflowResponse | null>(null);
  const [performance, setPerformance] = useState<IncomeVsExpenseResponse | null | undefined>(undefined);
  // undefined = ainda carregando | null = carregou mas falhou/vazio | dados = ok
  const [summary, setSummary] = useState<MonthlySummaryResponse | null | undefined>(undefined);
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [recentTx, setRecentTx] = useState<TransactionResponse[] | null>(null);
  const [error, setError] = useState(false);

  function loadData() {
    const month = currentMonthIso();
    Promise.all([
      getIncomeVsExpense(6),
      getAccounts(),
      getTransactions(0),
      getMe(),
      getCashflow(),
      getMonthlySummary(month).catch(() => null),
    ])
      .then(async ([p, a, tx, user, cf, sum]) => {
        setUserName(user.name.split(" ")[0]);
        setPerformance(p);
        setCashflow(cf);
        // null = endpoint falhou; garantimos que sai do estado undefined (skeleton)
        setSummary(sum ?? null);

        const active = a.filter((acc) => acc.active);
        const balances = await Promise.all(active.map((acc) => getAccountBalance(acc.id)));
        const enrichedAccounts = active.map((acc, i) => ({
          ...acc,
          currentBalance: Number(balances[i].currentBalance),
        }));
        setAccounts(enrichedAccounts);

        const sorted = [...tx.content].sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
        setRecentTx(sorted.slice(0, 5));
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    loadData();
    window.addEventListener("transaction-updated", loadData);
    return () => window.removeEventListener("transaction-updated", loadData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <p className="mt-12 text-center text-sm text-zinc-400">
        Não foi possível carregar os dados. Tente novamente.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{greeting()},</p>
          {userName === null ? (
            <span className="inline-block h-3.5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          ) : (
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{userName}</p>
          )}
        </div>
        <button
          onClick={openTransactionForm}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={15} />
          Nova transação
        </button>
      </div>

      {/* saldo disponível + saldo livre */}
      {cashflow === null ? (
        <>
          <BalanceSkeleton />
          <PlanningCardSkeleton />
        </>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Saldo disponível</p>
            <p className={`mt-3 text-4xl font-light tracking-tight ${cashflow.currentBalance < 0 ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-50"}`}>
              {formatCurrency(cashflow.currentBalance)}
            </p>
          </div>
          <PlanningCard data={cashflow} />
        </>
      )}

      {/* gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* receitas vs despesas — 3/5 */}
        <div className="lg:col-span-3">
          {performance === undefined ? (
            <IncomeVsExpenseChartSkeleton />
          ) : (
            <IncomeVsExpenseChart months={performance?.months ?? []} />
          )}
        </div>

        {/* despesas por categoria — 2/5 */}
        <div className="lg:col-span-2">
          {summary === undefined ? (
            <ExpenseByCategoryChartSkeleton />
          ) : (
            <ExpenseByCategoryChart
              categories={summary?.expensesByCategory ?? []}
              month={currentMonthLabel()}
            />
          )}
        </div>
      </div>

      {/* transações recentes */}
      {recentTx === null ? <RecentTransactionsSkeleton /> : (
        <RecentTransactions transactions={recentTx} />
      )}

      {/* contas */}
      {accounts === null ? <AccountsSkeleton /> : accounts.length > 0 ? (
        <div>
          <p className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">Contas</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: acc.color ?? "#a1a1aa" }} />
                  <div>
                    <p className="text-sm text-zinc-900 dark:text-zinc-50">{acc.name}</p>
                    <p className="text-xs text-zinc-400 capitalize dark:text-zinc-500">{acc.type.toLowerCase()}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{formatCurrency(Number(acc.currentBalance ?? acc.initialBalance ?? 0))}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
