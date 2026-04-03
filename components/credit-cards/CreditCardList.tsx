"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { CreditCardResponse } from "@/types/dashboard";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

// ─── linha do cartão ───────────────────────────────────────────────────────────

interface CreditCardRowProps {
  card: CreditCardResponse;
  onEdit: (card: CreditCardResponse) => void;
  onDelete: (id: string) => Promise<void>;
}

function CreditCardRow({ card, onEdit, onDelete }: CreditCardRowProps) {
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
        {/* cor + info — link para detalhes */}
        <Link
          href={`/cartoes/${card.id}`}
          className="flex flex-1 items-center gap-3 text-left"
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
        </Link>

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
