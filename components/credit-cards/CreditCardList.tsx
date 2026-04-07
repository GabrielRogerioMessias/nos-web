"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import type { CreditCardResponse, InvoiceResponse } from "@/types/dashboard";
import { InvoicePaymentModal } from "@/components/credit-cards/InvoicePaymentModal";

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
  onPaymentSuccess: () => void;
  onPaymentError: (msg: string) => void;
}

function CreditCardItem({ card, invoice, invoiceLoading, onEdit, onDelete, onPaymentSuccess, onPaymentError }: CreditCardItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(false);

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
  const disponivel = Math.max(0, limite - fatura);
  const pct = limite > 0 ? (fatura / limite) * 100 : 0;
  const isOver = pct > 100;

  // fatura paga
  const isInvoicePaid = invoice?.paid ?? false;

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
      <Link href={`/cartoes/${card.id}`} className="group flex flex-col gap-6 p-6">

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
            isClosed
              ? "text-amber-600 dark:text-amber-500"
              : "text-zinc-400 dark:text-zinc-500"
          }`}>
            {isClosed ? "Fatura fechada" : "Fatura atual"}
          </p>
          {invoiceLoading ? (
            <div className="mt-2 h-9 w-36 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ) : (
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(fatura)}
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

      {/* ── rodapé de ação/status da fatura ── */}
      {!confirming && (isInvoicePaid || isClosed) && (
        <div className="border-t border-zinc-100 px-6 pb-4 pt-4 dark:border-zinc-800">
          {isInvoicePaid ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-medium text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-400">
              Fatura paga
            </div>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayingInvoice(true); }}
              className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Pagar fatura
            </button>
          )}
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
          onSuccess={() => { setPayingInvoice(false); onPaymentSuccess(); }}
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
  onPaymentSuccess: () => void;
  onPaymentError: (msg: string) => void;
}

export function CreditCardList({ items, onEdit, onDelete, onPaymentSuccess, onPaymentError }: CreditCardListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Nenhum cartão cadastrado.</p>
        <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">
          Clique em &quot;Novo cartão&quot; para começar.
        </p>
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
