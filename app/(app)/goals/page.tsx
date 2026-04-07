"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getGoals, createGoal, updateGoal, deleteGoal, achieveGoal } from "@/lib/goals";
import type { VaultResponse } from "@/lib/vaults";
import type { GoalResponse, GoalRequest } from "@/types/goals";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { GoalList, GoalListSkeleton } from "@/components/goals/GoalList";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { VaultOperationModal } from "@/components/vaults/VaultOperationModal";
import { VaultStatementSheet } from "@/components/vaults/VaultStatementSheet";

// ─── helpers ─────────────────────────────────────────────────────────────────

function goalToVault(goal: GoalResponse): VaultResponse {
  return {
    id: goal.vault!.id,
    name: goal.name,
    currentBalance: goal.vault!.currentBalance,
    active: true,
    vaultType: "GOAL",
  };
}

// ─── página ───────────────────────────────────────────────────────────────────

let toastIdCounter = 0;

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalResponse[] | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editing, setEditing] = useState<GoalResponse | null>(null);
  const [depositGoal, setDepositGoal] = useState<GoalResponse | null>(null);
  const [withdrawGoal, setWithdrawGoal] = useState<GoalResponse | null>(null);
  const [statementGoal, setStatementGoal] = useState<GoalResponse | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const loadGoals = useCallback(async () => {
    try {
      const data = await getGoals(0);
      setGoals(data.content);
    } catch {
      addToast("Não foi possível carregar as metas.", "error");
      setGoals([]);
    }
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  function openNew() { setEditing(null); setSlideOpen(true); }
  function openEdit(goal: GoalResponse) { setEditing(goal); setSlideOpen(true); }
  function closeModal() { setSlideOpen(false); setEditing(null); }

  async function handleSave(payload: GoalRequest) {
    try {
      if (editing) {
        const updated = await updateGoal(editing.id, payload);
        setGoals((prev) => prev ? prev.map((g) => g.id === updated.id ? updated : g) : prev);
        addToast("Meta atualizada com sucesso.");
      } else {
        const created = await createGoal(payload);
        setGoals((prev) => prev ? [...prev, created] : [created]);
        addToast("Meta criada com sucesso.");
      }
      closeModal();
    } catch {
      addToast("Erro ao salvar a meta. Tente novamente.", "error");
      throw new Error("api_error");
    }
  }

  async function handleDelete(goal: GoalResponse) {
    try {
      await deleteGoal(goal.id);
      setGoals((prev) => prev ? prev.filter((g) => g.id !== goal.id) : prev);
      addToast("Meta excluída.");
    } catch {
      addToast("Erro ao excluir a meta.", "error");
    }
  }

  async function handleAchieve(goal: GoalResponse) {
    try {
      await achieveGoal(goal.id);
      setGoals((prev) =>
        prev ? prev.map((g) => g.id === goal.id ? { ...g, achieved: true, progressPercent: 100 } : g) : prev
      );
      addToast("Parabéns! Meta concluída com sucesso.");
      loadGoals();
    } catch {
      addToast("Erro ao marcar a meta como concluída.", "error");
    }
  }

  const activeCount = goals?.filter((g) => !g.achieved).length ?? 0;
  const achievedCount = goals?.filter((g) => g.achieved).length ?? 0;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Metas</h1>
            {goals !== null && (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {activeCount} ativa{activeCount !== 1 ? "s" : ""}
                {achievedCount > 0 && ` · ${achievedCount} concluída${achievedCount !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={15} />
            Nova meta
          </button>
        </div>

        {/* lista */}
        {goals === null ? (
          <GoalListSkeleton />
        ) : (
          <GoalList
            goals={goals}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAchieve={handleAchieve}
            onDeposit={(goal) => setDepositGoal(goal)}
            onWithdraw={(goal) => setWithdrawGoal(goal)}
            onStatement={(goal) => setStatementGoal(goal)}
          />
        )}
      </div>

      {/* modal: criar/editar meta */}
      {slideOpen && (
        <GoalFormModal
          editing={editing}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {depositGoal?.vault && (
        <VaultOperationModal
          vault={goalToVault(depositGoal)}
          type="deposit"
          onClose={() => setDepositGoal(null)}
          onSuccess={() => { setDepositGoal(null); addToast("Depósito realizado!"); loadGoals(); }}
          onError={(msg) => addToast(msg, "error")}
        />
      )}

      {withdrawGoal?.vault && (
        <VaultOperationModal
          vault={goalToVault(withdrawGoal)}
          type="withdraw"
          onClose={() => setWithdrawGoal(null)}
          onSuccess={() => { setWithdrawGoal(null); addToast("Resgate realizado!"); loadGoals(); }}
          onError={(msg) => addToast(msg, "error")}
        />
      )}

      {statementGoal?.vault && (
        <VaultStatementSheet
          vault={goalToVault(statementGoal)}
          onClose={() => setStatementGoal(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
