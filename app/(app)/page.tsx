"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { getIncomeVsExpense, getAccounts, getCashflow, type CashflowResponse } from "@/lib/dashboard";
import { getAccountBalance } from "@/lib/accounts";
import { getTransactions } from "@/lib/transactions";
import { getMe } from "@/lib/user";
import { useTransactionForm } from "@/components/transactions/TransactionContext";
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

// ─── skeletons ────────────────────────────────────────────────────────────────

function BalanceSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
      <div className="mt-4 h-10 w-52 animate-pulse rounded bg-zinc-200" />
      <div className="my-5 border-t border-zinc-100" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="mt-2 h-5 w-24 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-5 h-4 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-10 animate-pulse rounded bg-zinc-100" />
            <div className="h-2 flex-1 animate-pulse rounded-full bg-zinc-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div>
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-zinc-200" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-200" />
              <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-200" />
            </div>
            <div className="mt-2 h-5 w-24 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <div>
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="h-3 w-10 animate-pulse rounded bg-zinc-100" />
              <div>
                <div className="h-3.5 w-32 animate-pulse rounded bg-zinc-200" />
                <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── planning card ────────────────────────────────────────────────────────────

function PlanningCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
        <div className="my-1 border-t border-zinc-100" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="h-5 w-28 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}

function PlanningCard({ data }: { data: CashflowResponse }) {
  const isFreeNegative = data.freeBalance < 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <p className="text-sm font-medium text-zinc-900">Saldo Livre</p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Saldo atual</span>
          <span className="text-sm tabular-nums text-zinc-700">{formatCurrency(data.currentBalance)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">(-) Contas fixas</span>
          <span className="text-sm tabular-nums text-zinc-500">– {formatCurrency(data.committedRecurring)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">(-) Faturas de cartão</span>
          <span className="text-sm tabular-nums text-zinc-500">– {formatCurrency(data.committedInvoices)}</span>
        </div>
        <div className="border-t border-zinc-100" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-900">= Saldo livre</span>
          <span className={`text-base font-semibold tabular-nums ${isFreeNegative ? "text-red-500" : "text-emerald-600"}`}>
            {formatCurrency(data.freeBalance)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── seção de desempenho ──────────────────────────────────────────────────────

function PerformanceSection({ data }: { data: IncomeVsExpenseResponse }) {
  const months = data.months.slice(-6).reverse();
  if (months.length === 0) return null;

  const maxAbsolute = Math.max(
    ...months.flatMap((m) => [m.totalIncome, m.totalExpense])
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <p className="mb-5 text-sm font-medium text-zinc-900">Últimos 6 meses</p>
      <div className="flex flex-col gap-4">
        {months.map((m) => {
          const incomeWidth = maxAbsolute > 0 ? (m.totalIncome / maxAbsolute) * 100 : 0;
          const expenseWidth = maxAbsolute > 0 ? (m.totalExpense / maxAbsolute) * 100 : 0;
          return (
            <div key={m.month}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">{m.month}</span>
                <span className={`text-xs font-medium ${m.balance >= 0 ? "text-zinc-700" : "text-zinc-500"}`}>
                  {m.balance >= 0 ? "+" : ""}{formatCurrency(m.balance)}
                </span>
              </div>
              <div className="mb-1 flex items-center gap-2">
                <span className="w-14 text-right text-[10px] text-zinc-400">entrada</span>
                <div className="flex-1 rounded-full bg-zinc-100" style={{ height: 4 }}>
                  <div className="h-full rounded-full bg-zinc-400 transition-all duration-500" style={{ width: `${incomeWidth}%` }} />
                </div>
                <span className="w-20 text-[10px] text-zinc-500">{formatCurrency(m.totalIncome)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 text-right text-[10px] text-zinc-400">saída</span>
                <div className="flex-1 rounded-full bg-zinc-100" style={{ height: 4 }}>
                  <div className="h-full rounded-full bg-zinc-300 transition-all duration-500" style={{ width: `${expenseWidth}%` }} />
                </div>
                <span className="w-20 text-[10px] text-zinc-500">{formatCurrency(m.totalExpense)}</span>
              </div>
            </div>
          );
        })}
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
        <p className="text-sm font-medium text-zinc-900">Transações recentes</p>
        <Link
          href="/extrato?from=dash"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700"
        >
          Ver todas <ChevronRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {transactions.map((tx) => {
          const isExpense = tx.type === "EXPENSE";
          const isTransfer = tx.type === "TRANSFER";
          return (
            <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4">
                <span className="w-10 flex-shrink-0 text-xs tabular-nums text-zinc-400">
                  {formatDate(tx.transactionDate)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-900">{tx.description}</p>
                  <p className="truncate text-xs text-zinc-400">{tx.category?.name ?? "—"}</p>
                </div>
              </div>
              <span className={`flex-shrink-0 text-sm tabular-nums ${
                isExpense ? "text-zinc-500" : isTransfer ? "text-zinc-400" : "text-zinc-900"
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
  const [performance, setPerformance] = useState<IncomeVsExpenseResponse | null>(null);
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [recentTx, setRecentTx] = useState<TransactionResponse[] | null>(null);
  const [error, setError] = useState(false);

  function loadData() {
    Promise.all([
      getIncomeVsExpense(6),
      getAccounts(),
      getTransactions(0),
      getMe(),
      getCashflow(),
    ])
      .then(async ([p, a, tx, user, cf]) => {
        setUserName(user.name.split(" ")[0]);
        setPerformance(p);
        setCashflow(cf);

        // enriquece contas com saldo real
        const active = a.filter((acc) => acc.active);
        const balances = await Promise.all(active.map((acc) => getAccountBalance(acc.id)));
        const enrichedAccounts = active.map((acc, i) => ({
          ...acc,
          currentBalance: Number(balances[i].currentBalance),
        }));
        setAccounts(enrichedAccounts);

        // transações recentes ordenadas
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
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <p className="text-sm text-zinc-500">{greeting()},</p>
          {userName === null ? (
            <span className="inline-block h-3.5 w-20 animate-pulse rounded bg-zinc-200" />
          ) : (
            <p className="text-sm font-medium text-zinc-900">{userName}</p>
          )}
        </div>
        <button
          onClick={openTransactionForm}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
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
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">Saldo disponível</p>
            <p className={`mt-3 text-4xl font-light tracking-tight ${cashflow.currentBalance < 0 ? "text-zinc-500" : "text-zinc-900"}`}>
              {formatCurrency(cashflow.currentBalance)}
            </p>
          </div>
          <PlanningCard data={cashflow} />
        </>
      )}

      {/* transações recentes */}
      {recentTx === null ? <RecentTransactionsSkeleton /> : (
        <RecentTransactions transactions={recentTx} />
      )}

      {/* desempenho */}
      {performance === null ? <PerformanceSkeleton /> : (
        <PerformanceSection data={performance} />
      )}

      {/* contas */}
      {accounts === null ? <AccountsSkeleton /> : accounts.length > 0 ? (
        <div>
          <p className="mb-4 text-sm font-medium text-zinc-900">Contas</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: acc.color ?? "#a1a1aa" }} />
                  <div>
                    <p className="text-sm text-zinc-900">{acc.name}</p>
                    <p className="text-xs text-zinc-400 capitalize">{acc.type.toLowerCase()}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-700">{formatCurrency(Number(acc.currentBalance ?? acc.initialBalance ?? 0))}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
