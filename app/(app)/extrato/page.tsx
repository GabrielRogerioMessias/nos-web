"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
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
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/transactions";

const EMPTY_FILTERS: TransactionFilters = {};

let toastIdCounter = 0;

export default function ExtratoPage() {
  const [transactions, setTransactions] = useState<TransactionResponse[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
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

  // carrega contas uma única vez para popular o select
  useEffect(() => {
    getAccounts().catch(() => null).then((data) => {
      if (data) setAccounts(data.filter((a) => a.active));
    });
  }, []);

  const loadTransactions = useCallback(async (p: number, f: TransactionFilters) => {
    setTransactions(null);
    try {
      const result = await getTransactions(p, f);
      const sorted = [...result.content].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      setTransactions(sorted);
      setTotalPages(result.totalPages);
    } catch {
      addToast("Não foi possível carregar as transações.", "error");
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    loadTransactions(page, filters);
  }, [page, filters, loadTransactions]);

  function handleFilterChange(next: TransactionFilters) {
    setFilters(next);
    setPage(0); // reset pagination on filter change
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
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
      loadTransactions(page, filters);
    } catch {
      addToast("Erro ao salvar a transação. Verifique os dados e tente novamente.", "error");
      throw new Error("api_error");
    }
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    addToast("Transação excluída.");
    loadTransactions(page, filters);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-zinc-900">Extrato</h1>
            {transactions !== null && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {transactions.length === 0
                  ? "Nenhuma transação"
                  : `${transactions.length} transaç${transactions.length !== 1 ? "ões" : "ão"} nesta página`}
              </p>
            )}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Plus size={15} />
            Nova transação
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

        {/* lista */}
        {transactions === null ? (
          <TransactionListSkeleton />
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}

        {/* paginação */}
        {totalPages > 1 && transactions !== null && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-zinc-500">
              {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <SlideOver
        open={slideOpen}
        onClose={closeSlide}
        title={editing ? "Editar transação" : "Nova transação"}
      >
        <TransactionForm
          editing={editing}
          onSave={handleSave}
          onCancel={closeSlide}
        />
      </SlideOver>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
