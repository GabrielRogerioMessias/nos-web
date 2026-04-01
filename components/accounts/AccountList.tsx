"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import type { AccountResponse } from "@/types/dashboard";

const TYPE_LABEL: Record<string, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Poupança",
  INVESTMENT: "Investimento",
  WALLET: "Carteira",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

export function AccountListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-200" />
            <div>
              <div className="h-3.5 w-32 animate-pulse rounded bg-zinc-200" />
              <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="h-5 w-5 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── menu de ações ─────────────────────────────────────────────────────────────

interface ActionsMenuProps {
  account: AccountResponse;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function ActionsMenu({ account, onEdit, onToggle, onDelete }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-zinc-200 bg-white py-1">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Pencil size={13} /> Editar
          </button>
          <button
            onClick={() => { setOpen(false); onToggle(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Power size={13} />
            {account.active ? "Desativar" : "Ativar"}
          </button>
          <div className="my-1 border-t border-zinc-100" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

// ─── lista ─────────────────────────────────────────────────────────────────────

interface AccountListProps {
  accounts: AccountResponse[];
  onEdit: (account: AccountResponse) => void;
  onToggle: (account: AccountResponse) => void;
  onDelete: (account: AccountResponse) => void;
}

export function AccountList({ accounts, onEdit, onToggle, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center">
        <p className="text-sm text-zinc-400">Nenhuma conta cadastrada.</p>
        <p className="mt-1 text-xs text-zinc-300">Clique em "Nova conta" para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {accounts.map((acc) => (
        <div
          key={acc.id}
          className={`flex items-center justify-between px-5 py-4 ${
            !acc.active ? "opacity-50" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: acc.color ?? "#a1a1aa" }}
            />
            <div>
              <p className="text-sm text-zinc-900">{acc.name}</p>
              <p className="text-xs text-zinc-400">
                {TYPE_LABEL[acc.type] ?? acc.type}
                {acc.bankName ? ` · ${acc.bankName}` : ""}
                {!acc.active ? " · Inativa" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-sm tabular-nums text-zinc-700">
              {formatCurrency(Number(acc.currentBalance ?? acc.initialBalance ?? 0))}
            </p>
            <ActionsMenu
              account={acc}
              onEdit={() => onEdit(acc)}
              onToggle={() => onToggle(acc)}
              onDelete={() => onDelete(acc)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
