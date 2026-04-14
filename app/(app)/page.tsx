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
  LayoutDashboard,
  BarChart2,
  ArrowLeftRight,
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
          <span className="text-xs tabular-nums text-zinc-200">{formatCurrency(data.currentBalance ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Cofres livres</span>
          <span className="text-xs tabular-nums text-zinc-200">{formatCurrency(data.availableVaultsBalance ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Metas financeiras</span>
          <span className="text-xs tabular-nums text-zinc-200">{formatCurrency(data.goalVaultsBalance ?? 0)}</span>
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
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Saldo Livre
      </p>
      <p className={`mt-3 text-xl font-bold tabular-nums tracking-tight ${isFreeNegative ? "text-red-400/90" : "text-zinc-900 dark:text-white"}`}>
        {formatCurrency(data.freeBalance)}
      </p>

      {/* detalhamento didático */}
      <div className="mt-4 flex flex-col">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Saldo nas contas</span>
          <span className="text-xs tabular-nums text-zinc-200">{formatCurrency(data.currentBalance)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Faturas atuais</span>
          <span className="text-xs tabular-nums text-zinc-200">- {formatCurrency(invoices)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-zinc-400">Cofre de faturas</span>
          <span className="text-xs tabular-nums text-zinc-200">+ {formatCurrency(saved)}</span>
        </div>
        {faturaDescoberta > 0 && (
          <>
            <hr className="my-2 border-zinc-800" />
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-zinc-400">Fatura a cobrir</span>
              <span className="text-xs tabular-nums text-zinc-200">- {formatCurrency(faturaDescoberta)}</span>
            </div>
          </>
        )}
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

// ─── tabs ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "performance" | "transactions";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Visão Geral", icon: <LayoutDashboard size={14} /> },
  { id: "performance", label: "Desempenho", icon: <BarChart2 size={14} /> },
  { id: "transactions", label: "Transações", icon: <ArrowLeftRight size={14} /> },
];

// ─── página ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { openTransactionForm } = useTransactionForm();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthIso);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
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

  // carrega summary sempre que o mês muda
  const loadSummary = useCallback(async (month: string) => {
    setSummary(undefined);
    const data = await getMonthlySummary(month).catch(() => null);
    setSummary(data);
  }, []);

  useEffect(() => {
    loadSummary(selectedMonth);
  }, [selectedMonth, loadSummary]);

  // recarrega todos os dados quando uma transação é criada/editada/excluída
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
      loadSummary(selectedMonth);
    }
    window.addEventListener("transaction-updated", onUpdated);
    return () => window.removeEventListener("transaction-updated", onUpdated);
  }, [selectedMonth, loadSummary]);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
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

      {/* ── tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-sm transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-zinc-900 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ aba: visão geral ═════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* linha 1 — KPIs: grid 12 colunas, items-stretch equaliza alturas */}
          <div className="grid grid-cols-12 items-stretch gap-4">
            {/* Patrimônio — col 3 */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              {cashflow === null ? (
                <MetricCardSkeleton />
              ) : (
                <WealthCard data={cashflow} />
              )}
            </div>

            {/* Receitas — col 3 */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              {summary === undefined ? (
                <MetricCardSkeleton />
              ) : (
                <MetricCard
                  label="Receitas"
                  value={totalIncome}
                  valueColor="text-emerald-600 dark:text-emerald-400"
                  iconBg="bg-emerald-50 dark:bg-emerald-950/40"
                  icon={<TrendingUp size={16} className="text-emerald-500" />}
                />
              )}
            </div>

            {/* Despesas — col 3 */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              {summary === undefined ? (
                <MetricCardSkeleton />
              ) : (
                <MetricCard
                  label="Despesas"
                  value={totalExpense}
                  valueColor="text-zinc-500 dark:text-zinc-400"
                  iconBg="bg-zinc-100 dark:bg-zinc-800"
                  icon={<TrendingDown size={16} className="text-zinc-400 dark:text-zinc-500" />}
                />
              )}
            </div>

            {/* Saldo Livre — col 3, borda destacada */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              {cashflow === null ? (
                <FreeCashCardSkeleton />
              ) : (
                <FreeCashCard data={cashflow} />
              )}
            </div>
          </div>

          {/* linha 2 — gráfico (8 cols) + categorias (4 cols), altura travada */}
          <div className="grid grid-cols-12 items-stretch gap-6">
            <div className="col-span-12 h-[420px] lg:col-span-8">
              {performance === undefined ? (
                <IncomeVsExpenseChartSkeleton />
              ) : (
                <IncomeVsExpenseChart months={performance?.months ?? []} />
              )}
            </div>

            <div className="col-span-12 h-[420px] lg:col-span-4">
              {summary === undefined ? (
                <ExpenseByCategoryListSkeleton />
              ) : (
                <ExpenseByCategoryList
                  categories={summary?.expensesByCategory ?? []}
                  month={monthLabel(selectedMonth)}
                  onNewTransaction={openTransactionForm}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* ══ aba: desempenho ══════════════════════════════════════════════════════ */}
      {activeTab === "performance" && (
        <div className="flex flex-col gap-6">
          {performance === undefined ? (
            <IncomeVsExpenseChartSkeleton />
          ) : (
            <IncomeVsExpenseChart months={performance?.months ?? []} />
          )}
          {summary === undefined ? (
            <ExpenseByCategoryListSkeleton />
          ) : (
            <ExpenseByCategoryList
              categories={summary?.expensesByCategory ?? []}
              month={monthLabel(selectedMonth)}
              onNewTransaction={openTransactionForm}
            />
          )}
        </div>
      )}

      {/* ══ aba: transações ══════════════════════════════════════════════════════ */}
      {activeTab === "transactions" && (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
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
      )}
    </div>
  );
}
