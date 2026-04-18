"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowRight,
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
import { UpcomingPayments } from "@/components/transactions/UpcomingPayments";
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
  // capitaliza só a primeira letra; "de" permanece minúsculo
  return label.charAt(0).toUpperCase() + label.slice(1).replace(/ De /g, " de ");
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

function monthDateRange(iso: string): { startDate: string; endDate: string } {
  const [y, m] = iso.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    startDate: `${iso}-01`,
    endDate: `${iso}-${String(lastDay).padStart(2, "0")}`,
  };
}

// ─── skeletons ────────────────────────────────────────────────────────────────

function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${className ?? ""}`}>
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
  subtitle?: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

function MetricCard({ label, subtitle, value, icon, iconBg, valueColor }: MetricCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {label}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-300 dark:text-zinc-600">{subtitle}</p>
          )}
        </div>
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-3 text-xl font-bold tabular-nums tracking-tight ${valueColor ?? "text-zinc-900 dark:text-white"}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

// ─── patrimônio card ──────────────────────────────────────────────────────────

function WealthCard({ data }: { data: CashflowResponse }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Patrimônio
        </p>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <PiggyBank size={16} className="text-zinc-500 dark:text-zinc-400" />
        </div>
      </div>
      <p className="mt-3 text-xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-white">
        {formatCurrency(data.netAvailableWealth ?? 0)}
      </p>
      <div className="mt-4 flex flex-col">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Saldo nas contas</span>
          <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">{formatCurrency(data.currentBalance ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Cofres livres</span>
          <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">{formatCurrency(data.availableVaultsBalance ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Metas financeiras</span>
          <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">{formatCurrency(data.goalVaultsBalance ?? 0)}</span>
        </div>
      </div>
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
  const invoices = data.committedInvoices ?? 0;
  const saved = data.savedForInvoices ?? 0;
  const faturaDescoberta = Math.max(0, invoices - saved);
  const isFreeNegative = data.freeBalance < 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Saldo Livre
        </p>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <TrendingUp size={16} className="text-zinc-500 dark:text-zinc-400" />
        </div>
      </div>
      <p className={`mt-3 text-xl font-bold tabular-nums tracking-tight ${isFreeNegative ? "text-red-400/90" : "text-zinc-900 dark:text-white"}`}>
        {formatCurrency(data.freeBalance)}
      </p>

      {/* detalhamento didático */}
      <div className="mt-4 flex flex-col">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Saldo nas contas</span>
          <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">{formatCurrency(data.currentBalance)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Faturas atuais</span>
          <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">- {formatCurrency(invoices)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Cofre de faturas</span>
          <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">+ {formatCurrency(saved)}</span>
        </div>
        {faturaDescoberta > 0 && (
          <>
            <hr className="my-2 border-zinc-200 dark:border-zinc-800" />
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-zinc-400">Fatura a cobrir</span>
              <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">- {formatCurrency(faturaDescoberta)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── unified balance card (mobile) ───────────────────────────────────────────

type BalanceTab = "free" | "wealth";

function UnifiedBalanceCard({ data }: { data: CashflowResponse }) {
  const [tab, setTab] = useState<BalanceTab>("free");

  const invoices = data.committedInvoices ?? 0;
  const saved = data.savedForInvoices ?? 0;
  const faturaDescoberta = Math.max(0, invoices - saved);
  const isFreeNegative = data.freeBalance < 0;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 md:hidden">
      {/* segmented control */}
      <div className="mb-5 flex rounded-lg bg-zinc-950 p-1">
        <button
          type="button"
          onClick={() => setTab("free")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all duration-200 ${
            tab === "free"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-400"
          }`}
        >
          Saldo Livre
        </button>
        <button
          type="button"
          onClick={() => setTab("wealth")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all duration-200 ${
            tab === "wealth"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-400"
          }`}
        >
          Patrimônio
        </button>
      </div>

      {/* conteúdo com transição de opacidade */}
      <div className="relative">
        {/* saldo livre */}
        <div className={`transition-opacity duration-200 ${tab === "free" ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Saldo Livre</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${isFreeNegative ? "text-red-400" : "text-white"}`}>
            {formatCurrency(data.freeBalance)}
          </p>
          <div className="mt-4 flex flex-col divide-y divide-zinc-800">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-zinc-400">Saldo nas contas</span>
              <span className="text-xs tabular-nums text-zinc-300">{formatCurrency(data.currentBalance)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-zinc-400">Faturas atuais</span>
              <span className="text-xs tabular-nums text-zinc-300">– {formatCurrency(invoices)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-zinc-400">Cofre de faturas</span>
              <span className="text-xs tabular-nums text-zinc-300">+ {formatCurrency(saved)}</span>
            </div>
            {faturaDescoberta > 0 && (
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-zinc-400">Fatura a cobrir</span>
                <span className="text-xs tabular-nums text-red-400">– {formatCurrency(faturaDescoberta)}</span>
              </div>
            )}
          </div>
        </div>

        {/* patrimônio */}
        <div className={`transition-opacity duration-200 ${tab === "wealth" ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Patrimônio</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-white">
            {formatCurrency(data.netAvailableWealth ?? 0)}
          </p>
          <div className="mt-4 flex flex-col divide-y divide-zinc-800">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-zinc-400">Saldo nas contas</span>
              <span className="text-xs tabular-nums text-zinc-300">{formatCurrency(data.currentBalance ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-zinc-400">Cofres livres</span>
              <span className="text-xs tabular-nums text-zinc-300">{formatCurrency(data.availableVaultsBalance ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-zinc-400">Metas financeiras</span>
              <span className="text-xs tabular-nums text-zinc-300">{formatCurrency(data.goalVaultsBalance ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnifiedBalanceCardSkeleton() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 md:hidden">
      <div className="mb-5 flex rounded-lg bg-zinc-950 p-1 gap-1">
        <div className="flex-1 h-7 animate-pulse rounded-md bg-zinc-800" />
        <div className="flex-1 h-7 animate-pulse rounded-md bg-zinc-800/50" />
      </div>
      <div className="h-3 w-20 animate-pulse rounded bg-zinc-700" />
      <div className="mt-2 h-9 w-36 animate-pulse rounded bg-zinc-700" />
      <div className="mt-4 flex flex-col gap-0 divide-y divide-zinc-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2.5">
            <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── resumo mobile (receitas + despesas consolidados) ────────────────────────

interface MonthlySummaryCardProps {
  income: number;
  expense: number;
  month: string; // ISO "YYYY-MM"
}

function MonthlySummaryCard({ income, expense, month }: MonthlySummaryCardProps) {
  const { startDate, endDate } = monthDateRange(month);
  const href = `/extrato?startDate=${startDate}&endDate=${endDate}&type=EXPENSE`;

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 transition-all active:scale-[0.98] active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800 md:hidden"
    >
      {/* receitas */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
          <TrendingUp size={15} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Receitas</p>
          <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(income)}
          </p>
        </div>
      </div>

      {/* divisor */}
      <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />

      {/* despesas */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <TrendingDown size={15} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Despesas</p>
          <p className="text-sm font-bold tabular-nums text-zinc-500 dark:text-zinc-400">
            {formatCurrency(expense)}
          </p>
        </div>
      </div>

      {/* seta indicando que é clicável */}
      <ArrowRight size={14} className="flex-shrink-0 text-zinc-300 dark:text-zinc-600" />
    </Link>
  );
}

function MonthlySummaryCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        <div>
          <div className="h-2.5 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-1.5 h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        <div>
          <div className="h-2.5 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-1.5 h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="h-3.5 w-3.5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

function FreeCashCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${className ?? ""}`}>
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

  // carrega transações recentes do mês selecionado
  const loadRecentTx = useCallback(async (month: string) => {
    setRecentTx(null);
    const { startDate, endDate } = monthDateRange(month);
    const tx = await getTransactions(0, { startDate, endDate }, 5).catch(() => null);
    if (tx) {
      const sorted = [...tx.content].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      setRecentTx(sorted);
    } else {
      setRecentTx([]);
    }
  }, []);

  // carrega dados fixos uma única vez
  useEffect(() => {
    async function loadFixed() {
      const [perf, user, cf] = await Promise.all([
        getIncomeVsExpense(6).catch(() => null),
        getMe().catch(() => null),
        getCashflow().catch(() => null),
      ]);

      if (user) setUserName(user.name.split(" ")[0]);
      setPerformance(perf ?? null);
      setCashflow(cf);
    }

    loadFixed();
  }, []);

  // carrega summary e transações recentes sempre que o mês muda
  const loadSummary = useCallback(async (month: string) => {
    setSummary(undefined);
    const data = await getMonthlySummary(month).catch(() => null);
    setSummary(data);
  }, []);

  useEffect(() => {
    loadSummary(selectedMonth);
    loadRecentTx(selectedMonth);
  }, [selectedMonth, loadSummary, loadRecentTx]);

  // recarrega dados dependentes do mês quando uma transação é criada/editada/excluída
  useEffect(() => {
    async function onUpdated() {
      const cf = await getCashflow().catch(() => null);
      if (cf) setCashflow(cf);
      loadSummary(selectedMonth);
      loadRecentTx(selectedMonth);
    }
    window.addEventListener("transaction-updated", onUpdated);
    return () => window.removeEventListener("transaction-updated", onUpdated);
  }, [selectedMonth, loadSummary, loadRecentTx]);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const isCurrentMonth = selectedMonth === currentMonthIso();

  return (
    <div className="flex w-full flex-col gap-5 pb-24 md:gap-6 md:pb-8">

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
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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

      {/* resumo mobile — receitas + despesas consolidados (apenas mobile) */}
      {summary === undefined ? (
        <MonthlySummaryCardSkeleton />
      ) : (
        <MonthlySummaryCard
          income={totalIncome}
          expense={totalExpense}
          month={selectedMonth}
        />
      )}

      {/* card unificado — apenas mobile */}
      {cashflow === null ? (
        <UnifiedBalanceCardSkeleton />
      ) : (
        <UnifiedBalanceCard data={cashflow} />
      )}

      {/* linha 1 — KPIs (apenas desktop) */}
      <div className="hidden md:grid md:grid-cols-2 md:items-stretch md:gap-4 lg:grid-cols-4">
        {/* Patrimônio — oculto no mobile (substituído pelo UnifiedBalanceCard) */}
        {cashflow === null ? (
          <MetricCardSkeleton className="hidden md:block" />
        ) : (
          <div className="hidden md:block">
            <WealthCard data={cashflow} />
          </div>
        )}

        {/* Receitas — oculto no mobile */}
        {summary === undefined ? (
          <MetricCardSkeleton className="hidden md:block" />
        ) : (
          <div className="hidden md:block">
            <MetricCard
              label="Receitas"
              value={totalIncome}
              valueColor="text-emerald-600 dark:text-emerald-400"
              iconBg="bg-emerald-50 dark:bg-emerald-950/40"
              icon={<TrendingUp size={16} className="text-emerald-500" />}
            />
          </div>
        )}

        {/* Despesas — oculto no mobile */}
        {summary === undefined ? (
          <MetricCardSkeleton className="hidden md:block" />
        ) : (
          <div className="hidden md:block">
            <MetricCard
              label="Despesas"
              value={totalExpense}
              valueColor="text-zinc-500 dark:text-zinc-400"
              iconBg="bg-zinc-100 dark:bg-zinc-800"
              icon={<TrendingDown size={16} className="text-zinc-400 dark:text-zinc-500" />}
            />
          </div>
        )}

        {/* Saldo Livre — oculto no mobile */}
        {cashflow === null ? (
          <FreeCashCardSkeleton className="hidden md:block" />
        ) : (
          <div className="hidden md:block">
            <FreeCashCard data={cashflow} />
          </div>
        )}
      </div>

      {/* linha 2 — onde seu dinheiro foi (full-width) */}
      {summary === undefined ? (
        <ExpenseByCategoryListSkeleton />
      ) : (
        <ExpenseByCategoryList
          categories={summary?.expensesByCategory ?? []}
          month={monthLabel(selectedMonth)}
          onNewTransaction={openTransactionForm}
        />
      )}

      {/* linha 3 — gráfico receitas vs despesas (full-width) */}
      {performance === undefined ? (
        <IncomeVsExpenseChartSkeleton />
      ) : (
        <IncomeVsExpenseChart months={performance?.months ?? []} />
      )}

      {/* linha 4 — transações recentes (full-width) */}
      <UpcomingPayments
        onPaid={() => {
          getCashflow().then((cf) => { if (cf) setCashflow(cf); }).catch(() => {});
          loadSummary(selectedMonth);
        }}
      />
      {recentTx === null ? (
        <RecentTransactionsSkeleton />
      ) : (
        <RecentTransactions transactions={recentTx} />
      )}
    </div>
  );
}
