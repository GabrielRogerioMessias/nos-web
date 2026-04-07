"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreditCard,
  MoreHorizontal,
  Pencil,
  Power,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  getRecurringTransactions,
  toggleRecurringTransaction,
  deleteRecurringTransaction,
  type RecurringTransaction,
} from "@/lib/recurring-transactions";
import {
  getInstallmentPlans,
  deleteInstallmentPlan,
  type InstallmentPlan,
} from "@/lib/credit-cards";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

let toastIdCounter = 0;

// ─── switch ───────────────────────────────────────────────────────────────────

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-zinc-900 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── barra de progresso ───────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className="h-full rounded-full bg-zinc-900 transition-all duration-500 dark:bg-zinc-100"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── menu de ações (dropdown) ─────────────────────────────────────────────────

interface ActionsMenuProps {
  items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[];
}

function ActionsMenu({ items }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Ações"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-[160px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {items.map((item, i) => (
            <div key={i}>
              {i > 0 && item.danger && (
                <div className="border-t border-zinc-100 dark:border-zinc-800" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm ${
                  item.danger
                    ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── modal de confirmação ─────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, description, confirmLabel, loading, onConfirm, onCancel }: ConfirmModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onCancel} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div>
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="h-6 w-6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-5 w-14 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

// ─── card de assinatura ───────────────────────────────────────────────────────

interface RecurringCardProps {
  item: RecurringTransaction;
  onToggle: (id: string) => Promise<void>;
  onDelete: (item: RecurringTransaction) => void;
}

function RecurringCard({ item, onToggle, onDelete }: RecurringCardProps) {
  const [toggling, setToggling] = useState(false);
  const isIncome = item.type === "INCOME";
  const freqLabel = item.frequency === "MONTHLY" ? "Mensal" : "Anual";

  async function handleToggle() {
    setToggling(true);
    await onToggle(item.id).finally(() => setToggling(false));
  }

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-opacity dark:border-zinc-800 dark:bg-zinc-900 ${!item.active ? "opacity-60" : ""}`}>
      {/* cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
            isIncome
              ? "bg-emerald-50 dark:bg-emerald-950/40"
              : "bg-zinc-100 dark:bg-zinc-800"
          }`}>
            {isIncome
              ? <TrendingUp size={18} className="text-emerald-500" />
              : <TrendingDown size={18} className="text-zinc-400 dark:text-zinc-500" />
            }
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {item.description}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {item.categoryName ?? (isIncome ? "Receita" : "Despesa")}
              {item.accountName ? ` · ${item.accountName}` : ""}
            </p>
          </div>
        </div>

        <ActionsMenu items={[
          {
            label: "Excluir",
            icon: <Trash2 size={13} />,
            onClick: () => onDelete(item),
            danger: true,
          },
        ]} />
      </div>

      {/* valor + frequência */}
      <div className="flex items-center justify-between">
        <p className={`text-xl font-bold tabular-nums ${
          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-50"
        }`}>
          {isIncome ? "+ " : "– "}{formatCurrency(item.amount)}
        </p>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {freqLabel}
        </span>
      </div>

      {/* rodapé: próximo vencimento + switch */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div>
          {item.nextDueDate ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Próximo: <span className="font-medium text-zinc-600 dark:text-zinc-400">{formatDate(item.nextDueDate)}</span>
            </p>
          ) : (
            <p className="text-xs text-zinc-300 dark:text-zinc-600">Sem próximo vencimento</p>
          )}
          {!item.active && (
            <p className="mt-0.5 text-xs text-amber-500 dark:text-amber-400">Pausada</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {item.active ? "Ativa" : "Pausada"}
          </span>
          <Switch checked={item.active} onChange={handleToggle} disabled={toggling} />
        </div>
      </div>
    </div>
  );
}

// ─── card de parcelamento ─────────────────────────────────────────────────────

interface InstallmentCardProps {
  item: InstallmentPlan;
  onDelete: (item: InstallmentPlan) => void;
}

function InstallmentCard({ item, onDelete }: InstallmentCardProps) {
  const pct = item.totalInstallments > 0
    ? Math.round((item.currentInstallment / item.totalInstallments) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      {/* cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.description}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <CreditCard size={11} className="flex-shrink-0" />
            <span className="truncate">{item.creditCardName}</span>
            {item.categoryName && (
              <>
                <span className="text-zinc-200 dark:text-zinc-700">·</span>
                <span className="truncate">{item.categoryName}</span>
              </>
            )}
          </div>
        </div>

        <ActionsMenu items={[
          {
            label: "Cancelar parcelamento",
            icon: <Trash2 size={13} />,
            onClick: () => onDelete(item),
            danger: true,
          },
        ]} />
      </div>

      {/* progresso */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Parcela{" "}
            <span className="text-zinc-900 dark:text-zinc-50">{item.currentInstallment}</span>
            {" "}de{" "}
            <span className="text-zinc-900 dark:text-zinc-50">{item.totalInstallments}</span>
          </p>
          <p className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">{pct}%</p>
        </div>
        <ProgressBar value={pct} />
      </div>

      {/* valores */}
      <div className="flex justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
        <div className="min-w-0 flex flex-col">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Parcela</p>
          <p
            className="mt-0.5 truncate text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50"
            title={formatCurrency(item.installmentAmount)}
          >
            {formatCurrency(item.installmentAmount)}
          </p>
        </div>
        <div className="min-w-0 flex flex-col items-end">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Restante</p>
          <p
            className="mt-0.5 truncate text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50"
            title={formatCurrency(item.remainingAmount)}
          >
            {formatCurrency(item.remainingAmount)}
          </p>
        </div>
      </div>

      {/* próxima parcela */}
      {item.nextInstallmentDate && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Próxima parcela:{" "}
          <span className="font-medium text-zinc-600 dark:text-zinc-400">
            {formatDate(item.nextInstallmentDate)}
          </span>
        </p>
      )}
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </span>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>
    </div>
  );
}

// ─── página ───────────────────────────────────────────────────────────────────

type Tab = "recurring" | "installments";

export default function AssinaturasPage() {
  const [tab, setTab] = useState<Tab>("recurring");
  const [recurring, setRecurring] = useState<RecurringTransaction[] | null>(null);
  const [installments, setInstallments] = useState<InstallmentPlan[] | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // modais de confirmação
  const [deletingRecurring, setDeletingRecurring] = useState<RecurringTransaction | null>(null);
  const [deletingInstallment, setDeletingInstallment] = useState<InstallmentPlan | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = ++toastIdCounter;
    setToasts((p) => [...p, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((p) => p.filter((t) => t.id !== id));
  }

  const loadRecurring = useCallback(async () => {
    const data = await getRecurringTransactions().catch(() => null);
    // normaliza resposta paginada { content: [...] } ou array direto
    const list = Array.isArray(data) ? data : (data as unknown as { content: RecurringTransaction[] })?.content ?? [];
    setRecurring(list);
  }, []);

  const loadInstallments = useCallback(async () => {
    const data = await getInstallmentPlans().catch(() => null);
    // normaliza resposta paginada { content: [...] } ou array direto
    const raw = Array.isArray(data) ? data : (data as unknown as { content: InstallmentPlan[] })?.content ?? [];
    // filtra apenas ativos (exclui cancelados/concluídos)
    setInstallments(raw.filter((p) => p.active));
  }, []);

  useEffect(() => { loadRecurring(); }, [loadRecurring]);
  useEffect(() => { loadInstallments(); }, [loadInstallments]);

  // toggle assinatura
  async function handleToggle(id: string) {
    try {
      await toggleRecurringTransaction(id);
      setRecurring((prev) =>
        prev ? prev.map((r) => r.id === id ? { ...r, active: !r.active } : r) : prev
      );
    } catch {
      addToast("Erro ao alterar o status.", "error");
    }
  }

  // excluir assinatura
  async function handleDeleteRecurring() {
    if (!deletingRecurring) return;
    setDeleteLoading(true);
    try {
      await deleteRecurringTransaction(deletingRecurring.id);
      setRecurring((prev) => prev ? prev.filter((r) => r.id !== deletingRecurring.id) : prev);
      addToast("Assinatura excluída.");
      setDeletingRecurring(null);
    } catch {
      addToast("Erro ao excluir a assinatura.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  // cancelar parcelamento
  async function handleDeleteInstallment() {
    if (!deletingInstallment) return;
    setDeleteLoading(true);
    try {
      await deleteInstallmentPlan(deletingInstallment.id);
      setInstallments((prev) => prev ? prev.filter((p) => p.id !== deletingInstallment.id) : prev);
      addToast("Parcelamento cancelado.");
      setDeletingInstallment(null);
    } catch {
      addToast("Erro ao cancelar o parcelamento.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="flex w-full flex-col gap-6 pb-24 md:pb-8">

        {/* cabeçalho */}
        <div>
          <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Assinaturas e Parcelas</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Transações recorrentes e parcelamentos ativos
          </p>
        </div>

        {/* abas */}
        <div className="flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setTab("recurring")}
            className={`flex-1 rounded-lg py-2.5 text-sm transition-all ${
              tab === "recurring"
                ? "bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            Assinaturas
            {recurring !== null && recurring.length > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-600">
                {recurring.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("installments")}
            className={`flex-1 rounded-lg py-2.5 text-sm transition-all ${
              tab === "installments"
                ? "bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            Parcelamentos
            {installments !== null && installments.length > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-600">
                {installments.length}
              </span>
            )}
          </button>
        </div>

        {/* aba assinaturas */}
        {tab === "recurring" && (
          recurring === null ? (
            <GridSkeleton />
          ) : recurring.length === 0 ? (
            <EmptyState
              icon={<RefreshCw size={22} className="text-zinc-400 dark:text-zinc-500" />}
              title="Nenhuma assinatura cadastrada"
              subtitle="Crie transações recorrentes pelo botão Nova Transação."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recurring.map((item) => (
                <RecurringCard
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onDelete={setDeletingRecurring}
                />
              ))}
            </div>
          )
        )}

        {/* aba parcelamentos */}
        {tab === "installments" && (
          installments === null ? (
            <GridSkeleton />
          ) : installments.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={22} className="text-zinc-400 dark:text-zinc-500" />}
              title="Nenhum parcelamento ativo"
              subtitle="Parcelamentos de cartão de crédito aparecem aqui."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {installments.map((item) => (
                <InstallmentCard
                  key={item.id}
                  item={item}
                  onDelete={setDeletingInstallment}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* modal: excluir assinatura */}
      {deletingRecurring && (
        <ConfirmModal
          title="Excluir assinatura?"
          description={`"${deletingRecurring.description}" será excluída permanentemente. As transações já geradas não serão afetadas.`}
          confirmLabel="Excluir"
          loading={deleteLoading}
          onConfirm={handleDeleteRecurring}
          onCancel={() => setDeletingRecurring(null)}
        />
      )}

      {/* modal: cancelar parcelamento */}
      {deletingInstallment && (
        <ConfirmModal
          title="Cancelar parcelamento?"
          description={`"${deletingInstallment.description}" será cancelado e todas as faturas futuras ainda não vencidas serão removidas.`}
          confirmLabel="Cancelar parcelamento"
          loading={deleteLoading}
          onConfirm={handleDeleteInstallment}
          onCancel={() => setDeletingInstallment(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
