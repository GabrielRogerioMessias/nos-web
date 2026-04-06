"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import type { AccountResponse } from "@/types/dashboard";

const TYPE_LABEL: Record<string, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Poupança",
  INVESTMENT: "Investimento",
  WALLET: "Carteira",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

export function AccountListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div>
                <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-1.5 h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-6 w-6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div>
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-2 h-8 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
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
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Ações"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-10 min-w-[144px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Pencil size={13} />
            Editar
          </button>
          <button
            onClick={() => { setOpen(false); onToggle(); }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Power size={13} />
            {account.active ? "Desativar" : "Ativar"}
          </button>
          <div className="border-t border-zinc-100 dark:border-zinc-800" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
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

// ─── card de conta ─────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: AccountResponse;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function AccountCard({ account, onEdit, onToggle, onDelete }: AccountCardProps) {
  const accentColor = account.color ?? "#a1a1aa";
  const balance = Number(account.currentBalance ?? account.initialBalance ?? 0);
  const typeLabel = TYPE_LABEL[account.type] ?? account.type;

  return (
    <div
      className={`flex flex-col rounded-2xl border border-zinc-200 bg-white transition-colors dark:border-zinc-800 dark:bg-zinc-950${!account.active ? " opacity-50" : ""}`}
    >
      {/* corpo */}
      <div className="flex flex-col gap-5 p-6">
        {/* cabeçalho: ícone + nome + ações */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-bold"
              style={{ backgroundColor: accentColor + "22", color: accentColor }}
            >
              {account.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {account.name}
              </p>
              {account.bankName && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{account.bankName}</p>
              )}
            </div>
          </div>

          <ActionsMenu
            account={account}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        </div>

        {/* saldo */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Saldo atual
          </p>
          <p
            className={`mt-1 text-3xl font-bold tracking-tight${
              balance < 0
                ? " text-red-500"
                : " text-zinc-900 dark:text-white"
            }`}
          >
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* rodapé */}
      <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {typeLabel}
          </span>
          {!account.active && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              Inativa
            </span>
          )}
        </div>

        <Link
          href="/extrato"
          className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Ver extrato →
        </Link>
      </div>
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
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Nenhuma conta cadastrada.</p>
        <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">
          Clique em &quot;Nova conta&quot; para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {accounts.map((acc) => (
        <AccountCard
          key={acc.id}
          account={acc}
          onEdit={() => onEdit(acc)}
          onToggle={() => onToggle(acc)}
          onDelete={() => onDelete(acc)}
        />
      ))}
    </div>
  );
}
