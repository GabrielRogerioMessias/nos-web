"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { SlideOver } from "@/components/ui/SlideOver";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { createTransaction } from "@/lib/transactions";
import type { TransactionRequest } from "@/types/dashboard";

interface TransactionContextValue {
  openTransactionForm: () => void;
}

const TransactionContext = createContext<TransactionContextValue>({
  openTransactionForm: () => {},
});

export function useTransactionForm() {
  return useContext(TransactionContext);
}

let toastId = 0;

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const openTransactionForm = useCallback(() => setOpen(true), []);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSave(payload: TransactionRequest) {
    try {
      await createTransaction(payload);
      setOpen(false);
      addToast("Transação registrada com sucesso.");
      // evento já disparado pelo TransactionForm após onSave resolver
    } catch (err: unknown) {
      let message = "Erro ao salvar a transação. Tente novamente.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response: { data?: { message?: string } } };
        if (axiosErr.response.data?.message) {
          message = axiosErr.response.data.message;
        }
      }
      addToast(message, "error");
      throw new Error("api_error");
    }
  }

  return (
    <TransactionContext.Provider value={{ openTransactionForm }}>
      {children}

      <SlideOver open={open} onClose={() => setOpen(false)} title="Nova transação">
        <TransactionForm
          onSave={handleSave}
          onSuccess={() => {
            setOpen(false);
            addToast("Transação registrada com sucesso.");
            window.dispatchEvent(new CustomEvent("transaction-updated"));
          }}
          onCancel={() => setOpen(false)}
        />
      </SlideOver>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </TransactionContext.Provider>
  );
}
