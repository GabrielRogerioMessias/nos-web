"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Trash2, MoreHorizontal, CreditCard, Plus } from "lucide-react";
import type { CreditCardResponse, InvoiceResponse } from "@/types/dashboard";
import { getInvoice } from "@/lib/credit-cards";
import { InvoicePaymentModal } from "@/components/credit-cards/InvoicePaymentModal";

function nextMonthISO(current: string): string {
  const [y, m] = current.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

function currentMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleString("pt-BR", { month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// ─── skeleton ──────────────────────────────────────────────────────────────────

export function CreditCardListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-6 p-6">
            {/* cabeçalho */}
            <div className="flex items-start justify-between">
              <div>
                <div className="h-5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-1.5 h-3 w-14 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-6 w-6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
            {/* fatura */}
            <div>
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-2 h-9 w-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            </div>
            {/* barra */}
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-full animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
            {/* ver fatura */}
            <div className="flex justify-end">
              <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          {/* rodapé badges */}
          <div className="flex gap-2 border-t border-zinc-100 px-6 py-3.5 dark:border-zinc-800">
            <div className="h-6 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── menu de ações ─────────────────────────────────────────────────────────────

interface ActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

function ActionsMenu({ onEdit, onDelete }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Ações"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-[136px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Pencil size={13} />
            Editar
          </button>
          <div className="border-t border-zinc-100 dark:border-zinc-800" />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 size={13} />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

// ─── barra de progresso ────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0–100
  color: string;
}

function ProgressBar({ value, color }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const isOver = value > 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${clamped}%`,
          backgroundColor: isOver ? "#ef4444" : color,
        }}
      />
    </div>
  );
}

// ─── confirmação de exclusão ───────────────────────────────────────────────────

interface DeleteConfirmProps {
  cardName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ cardName, deleting, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
      <p className="text-xs text-red-600 dark:text-red-400">
        Remover <span className="font-medium">{cardName}</span>?
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="rounded px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
        >
          Não
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {deleting ? "Removendo…" : "Sim, remover"}
        </button>
      </div>
    </div>
  );
}

// ─── card individual ───────────────────────────────────────────────────────────

interface CreditCardItemProps {
  card: CreditCardResponse;
  invoice: InvoiceResponse | null;
  invoiceLoading: boolean;
  onEdit: (card: CreditCardResponse) => void;
  onDelete: (id: string) => Promise<void>;
  onPaymentSuccess: (cardId: string) => void;
  onPaymentError: (msg: string) => void;
}

function CreditCardItem({ card, invoice, invoiceLoading, onEdit, onDelete, onPaymentSuccess, onPaymentError }: CreditCardItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(false);

  // próxima fatura — carregada sob demanda quando a fatura atual está paga
  const [nextInvoice, setNextInvoice] = useState<InvoiceResponse | null>(null);
  const [nextInvoiceLoading, setNextInvoiceLoading] = useState(false);

  const isInvoicePaid = invoice?.paid ?? false;

  useEffect(() => {
    if (!isInvoicePaid) { setNextInvoice(null); return; }
    const month = nextMonthISO(currentMonthISO());
    setNextInvoiceLoading(true);
    getInvoice(card.id, month)
      .then(setNextInvoice)
      .catch(() => setNextInvoice(null))
      .finally(() => setNextInvoiceLoading(false));
  }, [isInvoicePaid, card.id]);

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await onDelete(card.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  const accentColor = card.color ?? "#a1a1aa";
  const fatura = invoice?.totalAmount ?? 0;
  const limite = card.creditLimit ?? 0;
  // usa availableLimit da API como fonte primária; fallback manual apenas se ausente
  const disponivel = card.availableLimit != null
    ? card.availableLimit
    : Math.max(0, limite - (isInvoicePaid ? 0 : fatura));
  const pct = limite > 0 ? Math.min(100, ((limite - disponivel) / limite) * 100) : 0;
  const isOver = limite > 0 && disponivel < 0;

  // fatura fechada: hoje >= closingDate, há valor e não foi paga
  const isClosed = !!invoice?.closingDate && fatura > 0 && !isInvoicePaid &&
    new Date().toISOString().slice(0, 10) >= invoice.closingDate;

  const statusLabel = !card.active
    ? "Inativo"
    : isInvoicePaid
    ? "Paga"
    : isClosed
    ? "Fatura fechada"
    : isOver
    ? "Estourado"
    : fatura === 0
    ? "Sem fatura"
    : "Em uso";

  const statusClass = !card.active
    ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
    : isInvoicePaid
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : isClosed
    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
    : isOver
    ? "bg-red-500/10 text-red-500"
    : fatura === 0
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <div className={`flex flex-col rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950${!card.active ? " opacity-60" : ""}`}>
      {/* ── corpo clicável ── */}
      <Link href={`/cartoes/${card.id}${invoice?.month ? `?month=${invoice.month}` : ""}`} className="group flex flex-col gap-6 p-6">

        {/* ── cabeçalho: nome + bandeira à esq, status + menu à dir ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-zinc-900 dark:text-zinc-50">
              {card.name}
            </p>
            {card.brand ? (
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{card.brand}</p>
            ) : (
              <p className="mt-0.5 text-xs text-zinc-300 dark:text-zinc-600">Sem bandeira</p>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
            {/* menu — fora do Link para não disparar navegação */}
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <ActionsMenu onEdit={() => onEdit(card)} onDelete={() => setConfirming(true)} />
            </div>
          </div>
        </div>

        {/* ── fatura: herói ── */}
        <div>
          <p className={`text-xs font-medium uppercase tracking-widest ${
            isClosed && !isInvoicePaid
              ? "text-amber-600 dark:text-amber-500"
              : "text-zinc-400 dark:text-zinc-500"
          }`}>
            {isClosed && !isInvoicePaid ? "Fatura fechada" : "Fatura atual"}
          </p>
          {invoiceLoading ? (
            <div className="mt-2 h-9 w-36 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ) : isInvoicePaid ? (
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(0)}
            </p>
          ) : (
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(fatura)}
            </p>
          )}

          {/* subtítulo da próxima fatura */}
          {isInvoicePaid && (
            <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
              {nextInvoiceLoading
                ? "Carregando próxima fatura…"
                : nextInvoice
                ? `Próxima fatura (${monthLabel(nextMonthISO(currentMonthISO()))}): ${formatCurrency(nextInvoice.totalAmount)}`
                : `Próxima fatura (${monthLabel(nextMonthISO(currentMonthISO()))}): ${formatCurrency(0)}`}
            </p>
          )}
        </div>

        {/* ── barra de progresso de limite ── */}
        {limite > 0 ? (
          <div className="flex flex-col gap-2">
            <ProgressBar value={pct} color={accentColor} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  {formatCurrency(disponivel)}
                </span>{" "}
                livre
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                de {formatCurrency(limite)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-300 dark:text-zinc-600">Sem limite cadastrado</p>
        )}

        {/* seta de navegação */}
        <div className="flex items-center justify-end gap-1 text-zinc-300 transition-colors group-hover:text-zinc-400 dark:text-zinc-700 dark:group-hover:text-zinc-500">
          <span className="text-xs">Ver fatura</span>
          <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>

      {/* ── rodapé: badges de datas ── */}
      <div className="flex items-center gap-2 border-t border-zinc-100 px-6 py-3.5 dark:border-zinc-800">
        <span
          className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"
          style={{ backgroundColor: accentColor + "14" }}
        >
          Fecha dia {card.closingDay}
        </span>
        <span className="text-zinc-200 dark:text-zinc-700">·</span>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"
          style={{ backgroundColor: accentColor + "14" }}
        >
          Vence dia {card.dueDay}
        </span>
      </div>

      {/* ── rodapé: botão "Pagar fatura" apenas quando fechada e não paga ── */}
      {!confirming && isClosed && (
        <div className="border-t border-zinc-100 px-6 pb-4 pt-4 dark:border-zinc-800">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayingInvoice(true); }}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Pagar fatura
          </button>
        </div>
      )}

      {/* ── confirmação de exclusão ── */}
      {confirming && (
        <div className="border-t border-zinc-100 px-6 pb-5 pt-4 dark:border-zinc-800">
          <DeleteConfirm
            cardName={card.name}
            deleting={deleting}
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirming(false)}
          />
        </div>
      )}

      {/* ── modal de pagamento ── */}
      {payingInvoice && invoice && (
        <InvoicePaymentModal
          card={card}
          invoice={invoice}
          onClose={() => setPayingInvoice(false)}
          onSuccess={() => { setPayingInvoice(false); onPaymentSuccess(card.id); }}
          onError={(msg) => { setPayingInvoice(false); onPaymentError(msg); }}
        />
      )}
    </div>
  );
}

// ─── lista principal ───────────────────────────────────────────────────────────

export interface CardWithInvoice {
  card: CreditCardResponse;
  invoice: InvoiceResponse | null;
  invoiceLoading: boolean;
}

interface CreditCardListProps {
  items: CardWithInvoice[];
  onEdit: (card: CreditCardResponse) => void;
  onDelete: (id: string) => Promise<void>;
  onPaymentSuccess: (cardId: string) => void;
  onPaymentError: (msg: string) => void;
  onAddNew?: () => void;
}

export function CreditCardList({ items, onEdit, onDelete, onPaymentSuccess, onPaymentError, onAddNew }: CreditCardListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-20 text-center dark:border-zinc-800">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <CreditCard size={24} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nenhum cartão ainda</p>
        <p className="mt-1 max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
          Adicione seu cartão de crédito para centralizar suas faturas e controlar seu limite.
        </p>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="mt-6 flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={14} /> Adicionar meu primeiro cartão
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ card, invoice, invoiceLoading }) => (
        <CreditCardItem
          key={card.id}
          card={card}
          invoice={invoice}
          invoiceLoading={invoiceLoading}
          onEdit={onEdit}
          onDelete={onDelete}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
        />
      ))}
    </div>
  );
}
