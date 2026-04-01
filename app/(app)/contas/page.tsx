"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  getAccounts,
  getAccountBalance,
  createAccount,
  updateAccount,
  deleteAccount,
  toggleAccount,
} from "@/lib/accounts";
import type { AccountResponse, AccountRequest } from "@/types/dashboard";
import { SlideOver } from "@/components/ui/SlideOver";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountList, AccountListSkeleton } from "@/components/accounts/AccountList";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

let toastIdCounter = 0;

export default function ContasPage() {
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editing, setEditing] = useState<AccountResponse | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const loadAccounts = useCallback(async () => {
    try {
      const list = await getAccounts();
      const balances = await Promise.all(list.map((a) => getAccountBalance(a.id)));
      const merged = list.map((a, i) => ({
        ...a,
        currentBalance: Number(balances[i].currentBalance),
      }));
      setAccounts(merged);
    } catch {
      addToast("Não foi possível carregar as contas.", "error");
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  function openNew() {
    setEditing(null);
    setSlideOpen(true);
  }

  function openEdit(account: AccountResponse) {
    setEditing(account);
    setSlideOpen(true);
  }

  function closeSlide() {
    setSlideOpen(false);
    setEditing(null);
  }

  async function handleSave(payload: AccountRequest) {
    try {
      if (editing) {
        const updated = await updateAccount(editing.id, payload);
        setAccounts((prev) =>
          prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : prev
        );
        addToast("Conta atualizada com sucesso.");
      } else {
        const created = await createAccount(payload);
        const bal = await getAccountBalance(created.id);
        const enriched = { ...created, currentBalance: Number(bal.currentBalance) };
        setAccounts((prev) => (prev ? [...prev, enriched] : [enriched]));
        addToast("Conta criada com sucesso.");
      }
      closeSlide();
    } catch {
      addToast("Erro ao salvar a conta. Tente novamente.", "error");
    }
  }

  async function handleToggle(account: AccountResponse) {
    const balance = Number(account.currentBalance ?? account.initialBalance ?? 0);
    if (balance > 0) {
      addToast(
        `Não é possível inativar: transfira o saldo de ${formatCurrency(balance)} para outra conta primeiro.`,
        "error"
      );
      return;
    }
    try {
      await toggleAccount(account.id);
      setAccounts((prev) =>
        prev
          ? prev.map((a) =>
              a.id === account.id ? { ...a, active: !a.active } : a
            )
          : prev
      );
      addToast(account.active ? "Conta desativada." : "Conta ativada.");
    } catch {
      addToast("Erro ao alterar o status da conta.", "error");
    }
  }

  async function handleDelete(account: AccountResponse) {
    const balance = Number(account.currentBalance ?? account.initialBalance ?? 0);
    if (balance > 0) {
      addToast(
        `Não é possível excluir: transfira o saldo de ${formatCurrency(balance)} para outra conta primeiro.`,
        "error"
      );
      return;
    }
    try {
      await deleteAccount(account.id);
      setAccounts((prev) => (prev ? prev.filter((a) => a.id !== account.id) : prev));
      addToast("Conta excluída.");
    } catch {
      addToast("Erro ao excluir a conta.", "error");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-zinc-900">Contas</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {accounts === null
                ? ""
                : `${accounts.length} conta${accounts.length !== 1 ? "s" : ""} cadastrada${accounts.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Plus size={15} />
            Nova conta
          </button>
        </div>

        {/* lista */}
        {accounts === null ? (
          <AccountListSkeleton />
        ) : (
          <AccountList
            accounts={accounts}
            onEdit={openEdit}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* slide-over com formulário */}
      <SlideOver
        open={slideOpen}
        onClose={closeSlide}
        title={editing ? "Editar conta" : "Nova conta"}
      >
        <AccountForm
          editing={editing}
          onSave={handleSave}
          onCancel={closeSlide}
        />
      </SlideOver>

      {/* toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
