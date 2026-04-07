"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  Plus,
} from "lucide-react";
import {
  getIncomeVsExpense,
  getCashflow,
  getMonthlySummary,
  type CashflowResponse,
  type MonthlySummaryResponse,
} from "@/lib/dashboard";
import { getMe } from "@/lib/user";
import { getTransactions } from "@/lib/transactions";
import { useTransactionForm } from "@/components/transactions/TransactionContext";
import {
  IncomeVsExpenseChart,
  IncomeVsExpenseChartSkeleton,
} from "@/components/charts/IncomeVsExpenseChart";
import {
  ExpenseByCategoryList,
  ExpenseByCategoryListSkeleton,
} from "@/components/charts/ExpenseByCategoryChart";
import type { IncomeVsExpenseResponse, TransactionResponse } from "@/types/dashboard";

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

function monthLabel(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  // capitalize first letter
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function prevMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── skeletons ────────────────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-8 w-8 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="h-4 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
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
  );
}

// ─── metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

function MetricCard({ label, value, icon, iconBg, valueColor }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-3 text-xl font-bold tabular-nums tracking-tight ${valueColor ?? "text-zinc-900 dark:text-white"}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

// ─── transações recentes ──────────────────────────────────────────────────────

function RecentTransactions({ transactions }: { transactions: TransactionResponse[] }) {
  if (transactions.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Transações recentes</p>
        <Link
          href="/extrato?from=dash"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Ver todas <ChevronRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {transactions.map((tx) => {
          const isExpense = tx.type === "EXPENSE";
          const isTransfer = tx.type === "TRANSFER";
          return (
            <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex items-center gap-4">
                <span className="w-10 flex-shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                  {formatDate(tx.transactionDate)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">{tx.description}</p>
                  <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                    {tx.category?.name ?? "—"}
                  </p>
                </div>
              </div>
              <span
                className={`flex-shrink-0 text-sm tabular-nums ${
                  isExpense
                    ? "text-zinc-500 dark:text-zinc-400"
                    : isTransfer
                    ? "text-zinc-400 dark:text-zinc-500"
                    : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
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

// ─── saldo livre card ─────────────────────────────────────────────────────────

function FreeCashCard({ data }: { data: CashflowResponse }) {
  const saved = data.savedForInvoices ?? 0;
  const netInvoices = Math.max(0, data.committedInvoices - saved);
  const isFreeNegative = data.freeBalance < 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Saldo Livre
      </p>
      <p className={`mt-3 text-xl font-bold tabular-nums tracking-tight ${isFreeNegative ? "text-red-500" : "text-zinc-900 dark:text-white"}`}>
        {formatCurrency(data.freeBalance)}
      </p>
      <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">(-) Contas fixas</span>
          <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            – {formatCurrency(data.committedRecurring)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">(-) Faturas</span>
            {saved > 0 && (
              <p className="text-xs text-emerald-500 dark:text-emerald-400">
                {formatCurrency(saved)} no cofre
              </p>
            )}
          </div>
          <span className="flex-shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            – {formatCurrency(netInvoices)}
          </span>
        </div>
      </div>
    </div>
  );
}

function FreeCashCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── página ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { openTransactionForm } = useTransactionForm();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthIso);
  const [userName, setUserName] = useState<string | null>(null);

  // dados dependentes do mês
  const [summary, setSummary] = useState<MonthlySummaryResponse | null | undefined>(undefined);

  // dados independentes do mês
  const [cashflow, setCashflow] = useState<CashflowResponse | null>(null);
  const [performance, setPerformance] = useState<IncomeVsExpenseResponse | null | undefined>(undefined);
  const [recentTx, setRecentTx] = useState<TransactionResponse[] | null>(null);

  // carrega dados fixos uma única vez
  useEffect(() => {
    async function loadFixed() {
      const [perf, tx, user, cf] = await Promise.all([
        getIncomeVsExpense(6).catch(() => null),
        getTransactions(0).catch(() => null),
        getMe().catch(() => null),
        getCashflow().catch(() => null),
      ]);

      if (user) setUserName(user.name.split(" ")[0]);
      setPerformance(perf ?? null);
      setCashflow(cf);

      if (tx) {
        const sorted = [...tx.content].sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
        setRecentTx(sorted.slice(0, 5));
      } else {
        setRecentTx([]);
      }
    }

    loadFixed();
  }, []);

  // recarrega transações recentes quando uma transação é criada/editada
  useEffect(() => {
    async function onUpdated() {
      const [tx, cf] = await Promise.all([
        getTransactions(0).catch(() => null),
        getCashflow().catch(() => null),
      ]);
      if (cf) setCashflow(cf);
      if (tx) {
        const sorted = [...tx.content].sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
        setRecentTx(sorted.slice(0, 5));
      }
      // também recarrega o summary do mês atual
      loadSummary(selectedMonth);
    }
    window.addEventListener("transaction-updated", onUpdated);
    return () => window.removeEventListener("transaction-updated", onUpdated);
  }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // carrega summary sempre que o mês muda
  const loadSummary = useCallback(async (month: string) => {
    setSummary(undefined); // volta ao skeleton
    const data = await getMonthlySummary(month).catch(() => null);
    setSummary(data);
  }, []);

  useEffect(() => {
    loadSummary(selectedMonth);
  }, [selectedMonth, loadSummary]);

  // métricas do mês (derivadas do summary)
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const monthBalance = summary?.balance ?? 0;
  const freeBalance = cashflow?.freeBalance ?? 0;

  const isCurrentMonth = selectedMonth === currentMonthIso();

  return (
    <div className="flex w-full flex-col gap-6 pb-24 md:pb-8">

      {/* ── cabeçalho ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{greeting()},</p>
          {userName === null ? (
            <span className="mt-0.5 inline-block h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          ) : (
            <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{userName}</p>
          )}
        </div>
        <button
          onClick={openTransactionForm}
          className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Nova transação</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* ── seletor de mês ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => setSelectedMonth((m) => prevMonth(m))}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300">
          {monthLabel(selectedMonth)}
        </p>
        <button
          onClick={() => setSelectedMonth((m) => nextMonth(m))}
          disabled={isCurrentMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── 4 cards de métricas ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary === undefined ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            {cashflow === null ? <MetricCardSkeleton /> : (
              <FreeCashCard data={cashflow} />
            )}
          </>
        ) : (
          <>
            <MetricCard
              label="Receitas"
              value={totalIncome}
              valueColor="text-emerald-600 dark:text-emerald-400"
              iconBg="bg-emerald-50 dark:bg-emerald-950/40"
              icon={<TrendingUp size={16} className="text-emerald-500" />}
            />
            <MetricCard
              label="Despesas"
              value={totalExpense}
              valueColor="text-zinc-500 dark:text-zinc-400"
              iconBg="bg-zinc-100 dark:bg-zinc-800"
              icon={<TrendingDown size={16} className="text-zinc-400 dark:text-zinc-500" />}
            />
            <MetricCard
              label="Saldo do mês"
              value={monthBalance}
              valueColor={monthBalance >= 0 ? "text-zinc-900 dark:text-white" : "text-red-500"}
              iconBg="bg-zinc-100 dark:bg-zinc-800"
              icon={<Landmark size={16} className="text-zinc-400 dark:text-zinc-500" />}
            />
            {cashflow === null ? (
              <FreeCashCardSkeleton />
            ) : (
              <FreeCashCard data={cashflow} />
            )}
          </>
        )}
      </div>

      {/* ── gráfico receitas vs despesas ─────────────────────────────────────── */}
      <div>
        {performance === undefined ? (
          <IncomeVsExpenseChartSkeleton />
        ) : (
          <IncomeVsExpenseChart months={performance?.months ?? []} />
        )}
      </div>

      {/* ── top gastos por categoria + transações recentes — 2 colunas no lg ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* onde o dinheiro foi — 3/5 */}
        <div className="lg:col-span-3">
          {summary === undefined ? (
            <ExpenseByCategoryListSkeleton />
          ) : (
            <ExpenseByCategoryList
              categories={summary?.expensesByCategory ?? []}
              month={monthLabel(selectedMonth)}
            />
          )}
        </div>

        {/* transações recentes — 2/5 */}
        <div className="lg:col-span-2">
          {recentTx === null ? (
            <RecentTransactionsSkeleton />
          ) : (
            <RecentTransactions transactions={recentTx} />
          )}
        </div>
      </div>
    </div>
  );
}
