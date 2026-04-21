"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getTransactions, type TransactionFilters } from "@/lib/transactions";
import { getAccounts } from "@/lib/accounts";
import type { AccountResponse, TransactionResponse, TransactionRequest } from "@/types/dashboard";
import { SlideOver } from "@/components/ui/SlideOver";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { TransactionList, TransactionListSkeleton } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import {
  TransactionFiltersBar,
  PeriodSummary,
  PeriodSummarySkeleton,
} from "@/components/transactions/TransactionFilters";
import { createTransaction, updateTransaction } from "@/lib/transactions";
import { ContextualHelpDrawer } from "@/components/help/ContextualHelpDrawer";

const EMPTY_FILTERS: TransactionFilters = {};

let toastIdCounter = 0;

function currentMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(/ De /g, " de ");
}

function monthToDateRange(month: string): { startDate: string; endDate: string } {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export default function ExtratoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDash = searchParams.get("from") === "dash";
  const accountIdParam = searchParams.get("accountId");
  const startDateParam = searchParams.get("startDate"); // ex: "2026-04-01"
  const endDateParam = searchParams.get("endDate");     // ex: "2026-04-30"
  const typeParam = searchParams.get("type") as TransactionFilters["type"] | null;

  // se vier startDate na URL, deduz o mês a partir dela; senão usa mês atual
  function monthFromStartDate(startDate: string | null): string {
    if (!startDate) return currentMonthISO();
    return startDate.slice(0, 7); // "YYYY-MM"
  }

  const [selectedMonth, setSelectedMonth] = useState(() => monthFromStartDate(startDateParam));
  const [transactions, setTransactions] = useState<TransactionResponse[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const initial: TransactionFilters = {};
    if (accountIdParam) initial.accountId = accountIdParam;
    if (typeParam && typeParam !== "ALL") initial.type = typeParam;
    return initial;
  });
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionResponse | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // carrega contas uma única vez para popular o select e detectar arquivadas
  const [allAccounts, setAllAccounts] = useState<AccountResponse[]>([]);

  useEffect(() => {
    getAccounts().catch(() => null).then((data) => {
      if (data) {
        setAllAccounts(data);
        setAccounts(data.filter((a) => a.active));
      }
    });
  }, []);

  // conta selecionada está arquivada? → extrato somente-leitura
  const isAccountReadOnly = accountIdParam
    ? allAccounts.some((a) => a.id === accountIdParam && !a.active)
    : false;

  const loadTransactions = useCallback(async (p: number, f: TransactionFilters, month: string) => {
    setTransactions(null);
    try {
      const result = await getTransactions(p, f);
      const { startDate, endDate } = monthToDateRange(month);
      const filtered = result.content.filter((tx) => {
        return tx.transactionDate >= startDate && tx.transactionDate <= endDate;
      });
      const sorted = [...filtered].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      setTransactions(sorted);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      addToast("Não foi possível carregar as transações.", "error");
      setTransactions([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTransactions(page, filters, selectedMonth);
  }, [page, filters, selectedMonth, loadTransactions]);

  // recarrega silenciosamente após qualquer transação salva
  useEffect(() => {
    function onUpdated() { loadTransactions(page, filters, selectedMonth); }
    window.addEventListener("transaction-updated", onUpdated);
    return () => window.removeEventListener("transaction-updated", onUpdated);
  }, [page, filters, selectedMonth, loadTransactions]);

  function handleFilterChange(next: TransactionFilters) {
    setFilters(next);
    setPage(0);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  }

  function handlePrevMonth() {
    setSelectedMonth((m) => prevMonth(m));
    setPage(0);
  }

  function handleNextMonth() {
    setSelectedMonth((m) => nextMonth(m));
    setPage(0);
  }

  function openNew() {
    setEditing(null);
    setSlideOpen(true);
  }

  function openEdit(tx: TransactionResponse) {
    setEditing(tx);
    setSlideOpen(true);
  }

  function closeSlide() {
    setSlideOpen(false);
    setEditing(null);
  }

  async function handleSave(payload: TransactionRequest) {
    try {
      if (editing) {
        await updateTransaction(editing.id, payload);
        addToast("Transação atualizada com sucesso.");
      } else {
        await createTransaction(payload);
        addToast("Transação registrada com sucesso.");
      }
      closeSlide();
      loadTransactions(page, filters, selectedMonth);
    } catch {
      addToast("Erro ao salvar a transação. Verifique os dados e tente novamente.", "error");
      throw new Error("api_error");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {fromDash && (
              <button
                onClick={() => router.push("/")}
                className="flex-shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                aria-label="Voltar ao dashboard"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Extrato</h1>
                <ContextualHelpDrawer />
              </div>
              {transactions !== null && (
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {transactions.length === 0
                    ? "Nenhuma transação neste mês"
                    : `${transactions.length} transaç${transactions.length !== 1 ? "ões" : "ão"} neste mês`}
                </p>
              )}
            </div>
          </div>
          {!isAccountReadOnly && (
            <button
              onClick={openNew}
              className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:px-4 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Nova transação</span>
              <span className="sm:hidden">Nova</span>
            </button>
          )}
        </div>

        {/* seletor de mês */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3 sm:px-5 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            onClick={handlePrevMonth}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {monthLabel(selectedMonth)}
          </span>
          <button
            onClick={handleNextMonth}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* filtros */}
        <TransactionFiltersBar
          filters={filters}
          accounts={accounts}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        {/* resumo do período */}
        {transactions === null ? (
          <PeriodSummarySkeleton />
        ) : (
          <PeriodSummary transactions={transactions} />
        )}

        {/* aviso de conta arquivada */}
        {isAccountReadOnly && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Esta conta está arquivada. O extrato é somente-leitura — reative a conta para registrar novos lançamentos.
            </p>
          </div>
        )}

        {/* lista */}
        {transactions === null ? (
          <TransactionListSkeleton />
        ) : (
          <TransactionList
            transactions={transactions}
            readOnly={isAccountReadOnly}
            accounts={allAccounts}
            onEdit={openEdit}
            onDeleteSuccess={(message) => {
              addToast(message);
              loadTransactions(page, filters, selectedMonth);
            }}
          />
        )}

        {/* paginação */}
        {totalPages > 1 && transactions !== null && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {!isAccountReadOnly && (
        <SlideOver
          open={slideOpen}
          onClose={closeSlide}
          title={editing ? "Editar transação" : "Nova transação"}
        >
          <TransactionForm
            editing={editing}
            onSave={handleSave}
            onSuccess={() => {
              loadTransactions(page, filters, selectedMonth);
            }}
            onCancel={closeSlide}
          />
        </SlideOver>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
