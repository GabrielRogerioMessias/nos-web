"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal, Pencil, Trash2, CheckCircle2,
  ArrowDownCircle, ArrowUpCircle, ScrollText,
  AlertTriangle,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { GoalResponse } from "@/types/goals";

// ─── helpers ────────────────────────────────────────────────────────────���─────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<LucideProps> | undefined;
  if (!Icon) return null;
  return <Icon {...props} />;
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

export function GoalListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-5 w-5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex flex-col gap-2">
              <div className="h-7 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-1.5 w-full animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="flex border-t border-zinc-100 dark:border-zinc-800">
            <div className="h-10 flex-1 animate-pulse bg-zinc-50 dark:bg-zinc-900/50" />
            <div className="h-10 flex-1 animate-pulse bg-zinc-50 dark:bg-zinc-900/50" />
            <div className="h-10 w-12 animate-pulse bg-zinc-50 dark:bg-zinc-900/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AlertDialog inline ───────────────────────────────────────────────────────

interface AchieveDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function AchieveDialog({ onConfirm, onCancel }: AchieveDialogProps) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onCancel} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
          <AlertTriangle size={18} className="text-amber-500" />
        </div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Concluir esta meta?
        </p>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Esta ação não poderá ser desfeita. O dinheiro continuará guardado no cofre associado.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Concluir meta
          </button>
        </div>
      </div>
    </>
  );
}

// ─── menu de ações ───────────────────────────────────────────────────────���────

interface ActionsMenuProps {
  goal: GoalResponse;
  onEdit: () => void;
  onDelete: () => void;
  onAchieve: () => void;
}

function ActionsMenu({ goal, onEdit, onDelete, onAchieve }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Pencil size={13} /> Editar
          </button>

          {!goal.achieved && (
            <button
              onClick={() => { setOpen(false); onAchieve(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <CheckCircle2 size={13} /> Concluir meta
            </button>
          )}

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

// ─── card individual ────────────────────────���────────────────────────────────���

interface GoalCardProps {
  goal: GoalResponse;
  onEdit: (goal: GoalResponse) => void;
  onDelete: (goal: GoalResponse) => void;
  onAchieve: (goal: GoalResponse) => void;
  onDeposit: (goal: GoalResponse) => void;
  onWithdraw: (goal: GoalResponse) => void;
  onStatement: (goal: GoalResponse) => void;
}

function GoalCard({ goal, onEdit, onDelete, onAchieve, onDeposit, onWithdraw, onStatement }: GoalCardProps) {
  const saved = Number(goal.vault?.currentBalance ?? 0);
  const progress = clamp(Number(goal.progressPercent ?? 0), 0, 100);
  const isAchieved = goal.achieved;
  const hasVault = !!goal.vault?.id;
  const cardColor = goal.color ?? "#6366f1";
  const iconName = goal.icon ?? "Target";

  const [confirmAchieve, setConfirmAchieve] = useState(false);

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {/* body */}
        <div className="flex flex-col gap-3 p-5">
          {/* ícone + menu */}
          <div className="flex items-center justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${cardColor}20` }}
            >
              <DynamicIcon name={iconName} size={20} style={{ color: cardColor }} />
            </div>
            <ActionsMenu
              goal={goal}
              onEdit={() => onEdit(goal)}
              onDelete={() => onDelete(goal)}
              onAchieve={() => setConfirmAchieve(true)}
            />
          </div>

          {/* nome + badge */}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                {goal.name}
              </p>
              {isAchieved && (
                <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Concluída
                </span>
              )}
            </div>
            {goal.description && (
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500 line-clamp-1">
                {goal.description}
              </p>
            )}
          </div>

          {/* bloco financeiro */}
          <div>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(saved)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              de {formatCurrency(goal.targetAmount)}
            </p>

            {/* barra de progresso */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: isAchieved ? "#10b981" : cardColor,
                }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {Math.round(progress)}% atingido
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {isAchieved && goal.achievedAt
                  ? `Concluída em ${formatDate(goal.achievedAt)}`
                  : goal.projection?.projectedDate
                  ? `Previsão: ${formatDate(goal.projection.projectedDate)}`
                  : goal.targetDate
                  ? `Alvo: ${formatDate(goal.targetDate)}`
                  : "Sem data alvo"}
              </span>
            </div>
          </div>
        </div>

        {/* rodapé de ações */}
        {hasVault && (
          <div className="flex items-center border-t border-zinc-100 dark:border-zinc-800">
            {!isAchieved && (
              <>
                <button
                  type="button"
                  onClick={() => onDeposit(goal)}
                  className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                >
                  <ArrowDownCircle size={13} /> Guardar
                </button>
                <div className="h-5 w-px bg-zinc-100 dark:bg-zinc-800" />
                <button
                  type="button"
                  onClick={() => onWithdraw(goal)}
                  className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                >
                  <ArrowUpCircle size={13} /> Resgatar
                </button>
                <div className="h-5 w-px bg-zinc-100 dark:bg-zinc-800" />
              </>
            )}
            <button
              type="button"
              onClick={() => onStatement(goal)}
              className="flex items-center justify-center px-4 py-3 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-300"
              title="Ver extrato do cofre"
            >
              <ScrollText size={14} />
            </button>
          </div>
        )}
      </div>

      {confirmAchieve && (
        <AchieveDialog
          onConfirm={() => { setConfirmAchieve(false); onAchieve(goal); }}
          onCancel={() => setConfirmAchieve(false)}
        />
      )}
    </>
  );
}

// ─── lista ───────────────────────────��────────────────────────────────────────

interface GoalListProps {
  goals: GoalResponse[];
  onEdit: (goal: GoalResponse) => void;
  onDelete: (goal: GoalResponse) => void;
  onAchieve: (goal: GoalResponse) => void;
  onDeposit: (goal: GoalResponse) => void;
  onWithdraw: (goal: GoalResponse) => void;
  onStatement: (goal: GoalResponse) => void;
}

export function GoalList({ goals, onEdit, onDelete, onAchieve, onDeposit, onWithdraw, onStatement }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Nenhuma meta cadastrada.</p>
        <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">Clique em "Nova meta" para começar.</p>
      </div>
    );
  }

  const sorted = [...goals].sort((a, b) => Number(a.achieved) - Number(b.achieved));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onEdit={onEdit}
          onDelete={onDelete}
          onAchieve={onAchieve}
          onDeposit={onDeposit}
          onWithdraw={onWithdraw}
          onStatement={onStatement}
        />
      ))}
    </div>
  );
}
