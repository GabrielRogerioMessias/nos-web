"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/transactions";
import type { TransactionResponse, TransactionRequest } from "@/types/dashboard";
import { SlideOver } from "@/components/ui/SlideOver";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { TransactionList, TransactionListSkeleton } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";

let toastIdCounter = 0;

export default function ExtratoPage() {
  const [transactions, setTransactions] = useState<TransactionResponse[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
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

  const loadTransactions = useCallback(async (p: number) => {
    setTransactions(null);
    try {
      const result = await getTransactions(p);
      setTransactions(result.content);
      setTotalPages(result.totalPages);
    } catch {
      addToast("Não foi possível carregar as transações.", "error");
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    loadTransactions(page);
  }, [page, loadTransactions]);

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
      if (page === 0) {
        loadTransactions(0);
      } else {
        setPage(0);
      }
    } catch {
      addToast("Erro ao salvar a transação. Verifique os dados e tente novamente.", "error");
      throw new Error("api_error");
    }
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    addToast("Transação excluída.");
    loadTransactions(page);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
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

        {transactions === null ? (
          <TransactionListSkeleton />
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}

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
