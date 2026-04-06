"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getGoals, createGoal, updateGoal, deleteGoal, achieveGoal } from "@/lib/goals";
import { depositToVault } from "@/lib/vaults";
import type { VaultResponse } from "@/lib/vaults";
import { getAccounts } from "@/lib/accounts";
import type { GoalResponse, GoalRequest } from "@/types/goals";
import type { AccountResponse } from "@/types/dashboard";
import { Select } from "@/components/ui/Select";
import { SlideOver } from "@/components/ui/SlideOver";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { GoalList, GoalListSkeleton } from "@/components/goals/GoalList";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { VaultOperationModal } from "@/components/vaults/VaultOperationModal";
import { VaultStatementSheet } from "@/components/vaults/VaultStatementSheet";

// ─── DepositForm ──────────────────────────────────────────────────────────────

interface DepositFormProps {
  goal: GoalResponse;
  accounts: AccountResponse[];
  onSave: (amount: number, accountId: string) => Promise<void>;
  onCancel: () => void;
}

function DepositForm({ goal, accounts, onSave, onCancel }: DepositFormProps) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; accountId?: string }>({});

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  const saved = Number(goal.vault?.currentBalance ?? 0);
  const remaining = Math.max(0, goal.targetAmount - saved);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    const next: typeof errors = {};
    if (!amount || isNaN(parsed) || parsed <= 0) next.amount = "Informe um valor maior que zero.";
    if (!accountId) next.accountId = "Selecione uma conta de origem.";
    if (Object.keys(next).length) { setErrors(next); return; }

    setSaving(true);
    try {
      await onSave(parsed, accountId);
    } catch {
      // tratado no pai
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* contexto da meta */}
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Meta</p>
        <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">{goal.name}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
          <span>Guardado: <span className="text-zinc-700 dark:text-zinc-300">{formatCurrency(saved)}</span></span>
          <span>·</span>
          <span>Faltam: <span className="text-zinc-700 dark:text-zinc-300">{formatCurrency(remaining)}</span></span>
        </div>
      </div>

      {/* campo de valor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Valor a guardar</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0,00"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: undefined })); }}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 ${
            errors.amount ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          }`}
          autoFocus
        />
        {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
      </div>

      {/* conta de origem */}
      <Select
        label="Conta de origem"
        value={accountId}
        onChange={(e) => { setAccountId(e.target.value); setErrors((p) => ({ ...p, accountId: undefined })); }}
        options={
          accounts.length === 0
            ? [{ value: "", label: "Nenhuma conta ativa" }]
            : accounts.map((acc) => ({ value: acc.id, label: acc.name }))
        }
        error={errors.accountId}
      />

      <div className="mt-2 flex gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Depositando..." : "Confirmar depósito"}
        </button>
      </div>
    </form>
  );
}

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
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
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

  useEffect(() => {
    loadGoals();
    getAccounts()
      .then((list) => setAccounts(list.filter((a) => a.active)))
      .catch(() => {});
  }, [loadGoals]);

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

  async function handleDeposit(amount: number, accountId: string) {
    if (!depositGoal?.vault?.id) return;
    try {
      await depositToVault(depositGoal.vault.id, amount, accountId);
      setDepositGoal(null);
      addToast("Depósito realizado!");
      loadGoals();
    } catch {
      addToast("Erro ao realizar o depósito. Tente novamente.", "error");
      throw new Error("api_error");
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

      {/* slide-over: depositar */}
      <SlideOver
        open={!!depositGoal}
        onClose={() => setDepositGoal(null)}
        title="Guardar valor"
      >
        {depositGoal && (
          <DepositForm
            goal={depositGoal}
            accounts={accounts}
            onSave={handleDeposit}
            onCancel={() => setDepositGoal(null)}
          />
        )}
      </SlideOver>

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
