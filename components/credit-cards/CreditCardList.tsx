"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { getInvoice } from "@/lib/credit-cards";
import type { CreditCardResponse, InvoiceResponse } from "@/types/dashboard";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function currentMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ─── skeleton ──────────────────────────────────────────────────────────────────

export function CreditCardListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-200" />
            <div>
              <div className="h-3.5 w-32 animate-pulse rounded bg-zinc-200" />
              <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

// ─── painel de fatura ──────────────────────────────────────────────────────────

interface InvoicePanelProps {
  cardId: string;
}

function InvoicePanel({ cardId }: InvoicePanelProps) {
  const [month, setMonth] = useState(currentMonthISO());
  const [invoice, setInvoice] = useState<InvoiceResponse | null | "error">(null);
  const [loading, setLoading] = useState(false);
  const [loadedMonth, setLoadedMonth] = useState("");

  async function load(m: string) {
    if (loadedMonth === m) return;
    setLoading(true);
    setInvoice(null);
    try {
      const data = await getInvoice(cardId, m);
      setInvoice(data);
      setLoadedMonth(m);
    } catch {
      setInvoice("error");
    } finally {
      setLoading(false);
    }
  }

  // carrega ao montar
  useState(() => { load(month); });

  function handlePrev() {
    const m = prevMonth(month);
    setMonth(m);
    load(m);
  }

  function handleNext() {
    const m = nextMonth(month);
    setMonth(m);
    load(m);
  }

  return (
    <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4">
      {/* navegação de mês */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={handlePrev} className="rounded p-1 text-zinc-400 hover:bg-zinc-200">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-medium capitalize text-zinc-600">{monthLabel(month)}</span>
        <button onClick={handleNext} className="rounded p-1 text-zinc-400 hover:bg-zinc-200">
          <ChevronRight size={14} />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3.5 w-full animate-pulse rounded bg-zinc-200" />
          ))}
        </div>
      )}

      {invoice === "error" && (
        <p className="text-center text-xs text-zinc-400">Não foi possível carregar a fatura.</p>
      )}

      {invoice && invoice !== "error" && (
        <>
          {/* totais */}
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-xs text-zinc-400">
              Fecha {formatDate(invoice.closingDate)} · Vence {formatDate(invoice.dueDate)}
            </span>
            <span className="text-base font-light text-zinc-900">
              {formatCurrency(invoice.totalAmount)}
            </span>
          </div>

          {/* transações */}
          {invoice.transactions.length === 0 ? (
            <p className="text-center text-xs text-zinc-400">Nenhuma transação nesta fatura.</p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
              {invoice.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-zinc-900">{tx.description}</p>
                    <p className="text-[10px] text-zinc-400">
                      {tx.category?.name ?? "—"} · {formatDate(tx.transactionDate)}
                    </p>
                  </div>
                  <span className="ml-4 flex-shrink-0 text-xs tabular-nums text-zinc-500">
                    – {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── linha do cartão ───────────────────────────────────────────────────────────

interface CreditCardRowProps {
  card: CreditCardResponse;
  onEdit: (card: CreditCardResponse) => void;
  onDelete: (id: string) => Promise<void>;
}

function CreditCardRow({ card, onEdit, onDelete }: CreditCardRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await onDelete(card.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className={!card.active ? "opacity-50" : ""}>
      {/* linha principal */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* cor + info */}
        <button
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: card.color ?? "#a1a1aa" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-900">{card.name}</p>
            <p className="text-xs text-zinc-400">
              {card.brand ? `${card.brand} · ` : ""}
              Fecha dia {card.closingDay} · Vence dia {card.dueDay}
              {card.creditLimit ? ` · Limite ${formatCurrency(card.creditLimit)}` : ""}
            </p>
          </div>
          <ChevronDown
            size={14}
            className={`flex-shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {/* ações */}
        <div className="flex flex-shrink-0 items-center gap-0.5">
          {!confirming ? (
            <>
              <button
                onClick={() => onEdit(card)}
                className="rounded p-1.5 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="rounded p-1.5 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-zinc-500">Excluir?</span>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded px-2 py-0.5 font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "..." : "Sim"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded px-2 py-0.5 text-zinc-400 hover:bg-zinc-100"
              >
                Não
              </button>
            </div>
          )}
        </div>
      </div>

      {/* fatura expandida */}
      {expanded && <InvoicePanel cardId={card.id} />}
    </div>
  );
}

// ─── lista ─────────────────────────────────────────────────────────────────────

interface CreditCardListProps {
  cards: CreditCardResponse[];
  onEdit: (card: CreditCardResponse) => void;
  onDelete: (id: string) => Promise<void>;
}

export function CreditCardList({ cards, onEdit, onDelete }: CreditCardListProps) {
  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center">
        <p className="text-sm text-zinc-400">Nenhum cartão cadastrado.</p>
        <p className="mt-1 text-xs text-zinc-300">Clique em "Novo cartão" para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {cards.map((card) => (
        <CreditCardRow key={card.id} card={card} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
