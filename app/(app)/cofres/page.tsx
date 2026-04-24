"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, PiggyBank, ArrowDownCircle, ArrowUpCircle, Sparkles, MoreHorizontal, Pencil, Trash2, ChevronRight } from "lucide-react";
import { NoAccountModal } from "@/components/accounts/NoAccountModal";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { getVaults, deleteVault, type VaultResponse } from "@/lib/vaults";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { getAccounts } from "@/lib/accounts";
import { VaultFormModal } from "@/components/vaults/VaultFormModal";
import { VaultOperationModal } from "@/components/vaults/VaultOperationModal";
import { VaultStatementSheet } from "@/components/vaults/VaultStatementSheet";
import { VaultReconcileModal } from "@/components/vaults/VaultReconcileModal";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { ContextualHelpDrawer } from "@/components/help/ContextualHelpDrawer";

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
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="h-5 w-5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-2 h-7 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="flex border-t border-zinc-100 dark:border-zinc-800">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-10 flex-1 animate-pulse bg-zinc-50 dark:bg-zinc-800/40 ${i < 2 ? "border-r border-zinc-100 dark:border-zinc-800" : ""}`} />
        ))}
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
  yieldFlash,
}: {
  vault: VaultResponse;
  onDeposit: () => void;
  onWithdraw: () => void;
  onStatement: () => void;
  onReconcile: () => void;
  onEdit: () => void;
  onDelete: () => void;
  yieldFlash?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cardColor = vault.color ?? "#6366f1";
  const iconName = vault.icon ?? "PiggyBank";
  const isInvoice = vault.vaultType === "INVOICE";
  const yield_ = vault.totalYieldEarned ?? 0;
  const hasYield = yield_ > 0;

  return (
    <div className={`relative flex w-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-500 dark:bg-zinc-900 ${
      isInvoice
        ? "border-l-2 border-emerald-500/60 border-t-zinc-200 border-r-zinc-200 border-b-zinc-200 dark:border-t-zinc-800 dark:border-r-zinc-800 dark:border-b-zinc-800"
        : "border-zinc-200 dark:border-zinc-800"
    } ${yieldFlash ? "ring-2 ring-emerald-400/50 ring-offset-1" : ""}`}>

      {/* ── corpo ── */}
      <div className="flex flex-col gap-4 p-5">

        {/* cabeçalho: ícone + nome + menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${cardColor}18` }}
            >
              <DynamicIcon name={iconName} size={17} style={{ color: cardColor }} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {vault.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {isInvoice ? "Fatura" : "Livre"}
                </span>
                {vault.account && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                      {vault.account.bankName || vault.account.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* kebab */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 min-w-[136px] overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <div className="border-t border-zinc-100 dark:border-zinc-800" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* saldo */}
        <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Saldo guardado</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
            {formatCurrency(vault.currentBalance)}
          </p>

          {/* rendimentos — sempre ocupa espaço para manter altura uniforme */}
          <p className={`mt-1 flex items-center gap-1 text-[11px] text-emerald-500/80 ${hasYield ? "" : "invisible"}`}>
            <Sparkles size={10} />
            {isInvoice
              ? `Esta fatura já rendeu ${formatCurrency(yield_)}`
              : `+ ${formatCurrency(yield_)} em rendimentos`}
          </p>
        </div>
      </div>

      {/* ── ver extrato ── */}
      <div className="flex w-full justify-end px-5 pb-3">
        <button
          type="button"
          onClick={onStatement}
          className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Ver extrato <ChevronRight size={12} />
        </button>
      </div>

      {/* ── rodapé de ações ── */}
      <div className="flex w-full items-center border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={onDeposit}
          className="flex flex-1 items-center justify-center gap-1.5 h-10 text-xs text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 border-r border-zinc-100 dark:border-zinc-800"
        >
          <ArrowDownCircle size={13} />
          Guardar
        </button>
        <button
          onClick={onWithdraw}
          className="flex flex-1 items-center justify-center gap-1.5 h-10 text-xs text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 border-r border-zinc-100 dark:border-zinc-800"
        >
          <ArrowUpCircle size={13} />
          Resgatar
        </button>
        <button
          onClick={onReconcile}
          className="flex flex-1 items-center justify-center gap-1.5 h-10 text-xs text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
        >
          <Sparkles size={13} />
          Rendimentos
        </button>
      </div>
    </div>
  );
}

let toastIdCounter = 0;

export default function CofresPage() {
  const [vaults, setVaults] = useState<VaultResponse[] | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[]>([]); // só precisamos saber se há alguma
  const [showNoAccountsWarning, setShowNoAccountsWarning] = useState(false);
  const [modal, setModal] = useState<Modal | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [flashVaultId, setFlashVaultId] = useState<string | null>(null);
  const [vaultToDelete, setVaultToDelete] = useState<VaultResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    load();
    getAccounts()
      .then((list) => setAccounts(list.filter((a) => a.active).map((a) => a.id)))
      .catch(() => {});
  }, [load]);

  function openCreate() {
    if (accounts.length === 0) {
      setShowNoAccountsWarning(true);
      return;
    }
    setModal({ type: "create" });
  }

  async function confirmDelete() {
    if (!vaultToDelete) return;
    setIsDeleting(true);
    await deleteVault(vaultToDelete.id);
    setIsDeleting(false);
    setVaultToDelete(null);
    load();
  }

  const totalSaved = (vaults ?? []).reduce((s, v) => s + v.currentBalance, 0);
  const loading = vaults === undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Cofres</h1>
            <ContextualHelpDrawer />
          </div>
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
          onClick={openCreate}
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
            onClick={openCreate}
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
              onDelete={() => setVaultToDelete(vault)}
              yieldFlash={flashVaultId === vault.id}
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
            const vaultId = modal.vault.id;
            setModal(null);
            addToast(
              `Rendimento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(yieldAmount)} registrado com sucesso.`,
              "success",
            );
            load();
            setFlashVaultId(vaultId);
            setTimeout(() => setFlashVaultId(null), 1800);
          }}
          onError={(msg) => {
            setModal(null);
            addToast(msg);
          }}
        />
      )}

      {showNoAccountsWarning && (
        <NoAccountModal
          context="um cofre"
          onClose={() => setShowNoAccountsWarning(false)}
          onAccountCreated={() => {
            getAccounts()
              .then((list) => setAccounts(list.filter((a) => a.active).map((a) => a.id)))
              .catch(() => {});
          }}
        />
      )}

      {vaultToDelete && (
        <ConfirmDeleteModal
          title={`Excluir "${vaultToDelete.name}"?`}
          description="Esta ação não pode ser desfeita e os dados serão perdidos."
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setVaultToDelete(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
