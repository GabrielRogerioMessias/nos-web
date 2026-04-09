"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ChevronRight, Clock, Loader2 } from "lucide-react";
import {
  getPendingRecurringTransactions,
  payRecurringTransaction,
  type RecurringTransaction,
} from "@/lib/recurring-transactions";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDueDate(iso: string): { label: string; urgent: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso + "T12:00:00");
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return { label: "Vencida", urgent: true };
  if (diff === 0) return { label: "Vence hoje", urgent: true };
  if (diff === 1) return { label: "Vence amanhã", urgent: true };
  if (diff <= 7) return { label: `Em ${diff} dias`, urgent: true };
  const [, m, d] = iso.split("-");
  return { label: `${d}/${m}`, urgent: false };
}

const FREQUENCY_SHORT: Record<string, string> = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

// ─── skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-1.5 h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-7 w-7 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  onPaid?: () => void;
}

// ─── componente ──────────────────────────────────────────────────────────────

export function UpcomingPayments({ onPaid }: Props) {
  const [items, setItems] = useState<RecurringTransaction[] | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  function load() {
    getPendingRecurringTransactions()
      .then((list) => {
        const arr = Array.isArray(list)
          ? list
          : (list as unknown as { content: RecurringTransaction[] })?.content ?? [];
        setItems(arr);
      })
      .catch(() => setItems([]));
  }

  useEffect(() => {
    load();

    function onUpdate() { load(); }
    window.addEventListener("transaction-updated", onUpdate);
    return () => window.removeEventListener("transaction-updated", onUpdate);
  }, []);

  async function handlePay(item: RecurringTransaction) {
    if (paying) return;
    setPaying(item.id);
    try {
      await payRecurringTransaction(item.id);
      // marca como pago visualmente imediato
      setPaidIds((prev) => new Set([...prev, item.id]));
      // recarrega a lista após breve delay (deixa o check aparecer)
      setTimeout(() => {
        load();
        setPaidIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
        onPaid?.();
        window.dispatchEvent(new CustomEvent("transaction-updated"));
      }, 800);
    } catch {
      // silencia — toast pode ser adicionado pelo pai se necessário
    } finally {
      setPaying(null);
    }
  }

  if (items === null) return <Skeleton />;
  if (items.length === 0) return null;

  const visible = items.filter((i) => !paidIds.has(i.id)).slice(0, 5);
  if (visible.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* cabeçalho */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-amber-400" />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Próximos vencimentos</p>
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            {visible.length}
          </span>
        </div>
        <Link
          href="/assinaturas"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Ver todas <ChevronRight size={12} />
        </Link>
      </div>

      {/* lista */}
      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {visible.map((item) => {
          const { label, urgent } = formatDueDate(item.nextDueDate ?? "");
          const isPaying = paying === item.id;
          const freq = FREQUENCY_SHORT[item.frequency] ?? item.frequency;

          return (
            <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              {/* ícone + info */}
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Clock size={14} className={urgent ? "text-amber-400" : "text-zinc-400 dark:text-zinc-500"} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {item.description}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {item.categoryName ? `${item.categoryName} · ` : ""}{freq}
                  </p>
                </div>
              </div>

              {/* valor + data + botão pagar */}
              <div className="flex flex-shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(item.amount)}
                  </p>
                  <p className={`text-xs tabular-nums ${urgent ? "text-amber-500 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"}`}>
                    {label}
                  </p>
                </div>

                <button
                  onClick={() => handlePay(item)}
                  disabled={!!paying}
                  title="Registrar pagamento"
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed ${
                    isPaying
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                  }`}
                >
                  {isPaying ? (
                    <Loader2 size={14} className="animate-spin text-zinc-400" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
