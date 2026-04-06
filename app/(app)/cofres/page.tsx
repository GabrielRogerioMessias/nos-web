"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, PiggyBank, ArrowDownCircle, ArrowUpCircle, ScrollText, Sparkles, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { getVaults, deleteVault, type VaultResponse } from "@/lib/vaults";
import { VaultFormModal } from "@/components/vaults/VaultFormModal";
import { VaultOperationModal } from "@/components/vaults/VaultOperationModal";
import { VaultStatementSheet } from "@/components/vaults/VaultStatementSheet";
import { VaultReconcileModal } from "@/components/vaults/VaultReconcileModal";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";

type Modal =
  | { type: "create" }
  | { type: "edit"; vault: VaultResponse }
  | { type: "deposit"; vault: VaultResponse }
  | { type: "withdraw"; vault: VaultResponse }
  | { type: "statement"; vault: VaultResponse }
  | { type: "reconcile"; vault: VaultResponse };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<LucideProps> | undefined;
  if (!Icon) return <PiggyBank {...props} />;
  return <Icon {...props} />;
}

function VaultCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-6 p-6">
        {/* cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <div className="h-5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-1.5 h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="h-6 w-6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        {/* saldo */}
        <div>
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-2 h-9 w-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="flex border-t border-zinc-200 dark:border-zinc-800">
        <div className="h-12 flex-1 animate-pulse bg-zinc-50 dark:bg-zinc-900/50" />
        <div className="h-12 flex-1 animate-pulse bg-zinc-50 dark:bg-zinc-900/50" />
        <div className="h-12 flex-1 animate-pulse bg-zinc-50 dark:bg-zinc-900/50" />
      </div>
    </div>
  );
}

function VaultCard({
  vault,
  onDeposit,
  onWithdraw,
  onStatement,
  onReconcile,
  onEdit,
  onDelete,
}: {
  vault: VaultResponse;
  onDeposit: () => void;
  onWithdraw: () => void;
  onStatement: () => void;
  onReconcile: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cardColor = vault.color ?? "#6366f1";
  const iconName = vault.icon ?? "PiggyBank";

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* corpo */}
      <div className="flex flex-col gap-6 p-6">

        {/* ── cabeçalho: ícone + nome à esq, menu à dir ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${cardColor}20` }}
            >
              <DynamicIcon name={iconName} size={20} style={{ color: cardColor }} />
            </div>
            <div>
              <p className="line-clamp-2 text-base font-bold leading-snug text-zinc-900 dark:text-zinc-50">
                {vault.name}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                {vault.vaultType === "INVOICE" ? "Reserva de Fatura" : "Livre"}
              </p>
            </div>
          </div>

          {/* kebab menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 min-w-[144px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onStatement(); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <ScrollText size={13} /> Ver extrato
                  </button>
                  <div className="border-t border-zinc-100 dark:border-zinc-800" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── saldo herói ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            Saldo Atual
          </p>
          <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatCurrency(vault.currentBalance)}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {vault.vaultType === "INVOICE"
              ? "Cofre reservado para pagamento de fatura."
              : "Reserva de uso livre."}
          </p>
        </div>
      </div>

      {/* ── rodapé de ações ── */}
      <div className="flex w-full items-center border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onDeposit}
          className="flex flex-1 items-center justify-center gap-2 h-11 rounded-none px-2 text-xs font-medium whitespace-nowrap text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800"
        >
          <ArrowDownCircle size={14} />
          Guardar
        </button>
        <button
          onClick={onWithdraw}
          className="flex flex-1 items-center justify-center gap-2 h-11 rounded-none px-2 text-xs font-medium whitespace-nowrap text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800"
        >
          <ArrowUpCircle size={14} />
          Resgatar
        </button>
        <button
          onClick={onReconcile}
          className="flex flex-1 items-center justify-center gap-2 h-11 rounded-none px-2 text-xs font-medium whitespace-nowrap text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
        >
          <Sparkles size={14} />
          Rendimentos
        </button>
      </div>
    </div>
  );
}

let toastIdCounter = 0;

export default function CofresPage() {
  const [vaults, setVaults] = useState<VaultResponse[] | undefined>(undefined);
  const [modal, setModal] = useState<Modal | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  function addToast(message: string, type: ToastData["type"] = "error") {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const load = useCallback(() => {
    getVaults()
      .then((list) => setVaults(list.filter((v) => !v.vaultType || v.vaultType === "GENERAL" || v.vaultType === "INVOICE")))
      .catch(() => setVaults([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(vault: VaultResponse) {
    if (!confirm(`Excluir o cofre "${vault.name}"? Esta ação não pode ser desfeita.`)) return;
    await deleteVault(vault.id);
    load();
  }

  const totalSaved = (vaults ?? []).reduce((s, v) => s + v.currentBalance, 0);
  const loading = vaults === undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Cofres</h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Total guardado:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {formatCurrency(totalSaved)}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={15} />
          Novo cofre
        </button>
      </div>

      {/* grid */}
      {loading ? (
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <VaultCardSkeleton key={i} />)}
        </div>
      ) : vaults!.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-20 text-center dark:border-zinc-800">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <PiggyBank size={24} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nenhum cofre ainda</p>
          <p className="mt-1 max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
            Crie um cofre para separar dinheiro para objetivos específicos — como férias, emergências ou um projeto especial.
          </p>
          <button
            onClick={() => setModal({ type: "create" })}
            className="mt-6 flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={14} /> Criar meu primeiro cofre
          </button>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vaults!.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              onDeposit={() => setModal({ type: "deposit", vault })}
              onWithdraw={() => setModal({ type: "withdraw", vault })}
              onStatement={() => setModal({ type: "statement", vault })}
              onReconcile={() => setModal({ type: "reconcile", vault })}
              onEdit={() => setModal({ type: "edit", vault })}
              onDelete={() => handleDelete(vault)}
            />
          ))}
        </div>
      )}

      {/* modals */}
      {modal?.type === "create" && (
        <VaultFormModal
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
      {modal?.type === "edit" && (
        <VaultFormModal
          vault={modal.vault}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
        />
      )}
      {(modal?.type === "deposit" || modal?.type === "withdraw") && (
        <VaultOperationModal
          vault={modal.vault}
          type={modal.type}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load(); }}
          onError={(msg) => addToast(msg)}
        />
      )}
      {modal?.type === "statement" && (
        <VaultStatementSheet
          vault={modal.vault}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "reconcile" && (
        <VaultReconcileModal
          vault={modal.vault}
          onClose={() => setModal(null)}
          onSuccess={(yieldAmount) => {
            setModal(null);
            addToast(
              `Rendimento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(yieldAmount)} registrado com sucesso.`,
              "success",
            );
            load();
          }}
          onError={(msg) => {
            setModal(null);
            addToast(msg);
          }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
