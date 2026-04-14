"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createAccount } from "@/lib/accounts";
import { SlideOver } from "@/components/ui/SlideOver";
import { AccountForm } from "@/components/accounts/AccountForm";
import type { AccountRequest } from "@/types/dashboard";

interface NoAccountModalProps {
  /** Contexto: para que serve a conta. Ex: "um cartão de crédito", "uma meta financeira", "um cofre" */
  context?: string;
  onClose: () => void;
  /** Chamado após conta criada com sucesso — permite o pai recarregar contas */
  onAccountCreated?: () => void;
}

export function NoAccountModal({
  context = "este recurso",
  onClose,
  onAccountCreated,
}: NoAccountModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(payload: AccountRequest) {
    setSaving(true);
    try {
      await createAccount(payload);
      setShowForm(false);
      onClose();
      onAccountCreated?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* modal de aviso */}
      {!showForm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
          <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                  <AlertTriangle size={17} className="text-amber-500" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Conta bancária necessária
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={15} />
              </button>
            </div>
            <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
              Para cadastrar {context}, você precisa ter pelo menos uma conta bancária ativa.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Agora não
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Criar conta bancária
              </button>
            </div>
          </div>
        </>
      )}

      {/* form de criação de conta inline */}
      <SlideOver
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova conta bancária"
      >
        <AccountForm
          editing={null}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      </SlideOver>
    </>
  );
}
