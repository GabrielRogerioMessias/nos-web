"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { GoalRequest, GoalResponse } from "@/types/goals";
import { getAccounts } from "@/lib/accounts";
import type { AccountResponse } from "@/types/dashboard";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastState } from "@/components/ui/useToastState";
import { getApiErrorMessage } from "@/lib/api-error";

// ─── catálogo ─────────────────────────────────────────────────────────────────

const ICON_NAMES = [
  "Target", "Star", "Trophy", "Rocket", "TrendingUp", "BarChart2",
  "Home", "Car", "Plane", "GraduationCap", "Heart", "Shield",
  "Wallet", "PiggyBank", "Coins", "Banknote", "Gift", "Umbrella",
  "Dumbbell", "Music", "BookOpen", "Briefcase", "Building2", "Zap",
] as const;

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#a3a3a3",
];

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<LucideProps> | undefined;
  if (!Icon) return <span className="text-[10px] text-zinc-400">{name.slice(0, 2)}</span>;
  return <Icon {...props} />;
}

// ─── form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  targetAmount: string;
  targetDate: string;
  monthlyContribution: string;
  yieldRatePercent: string;
}

interface FieldErrors {
  name?: string;
  targetAmount?: string;
  accountId?: string;
}

function validate(values: FormState, accountId: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "O nome da meta é obrigatório.";
  const amount = parseFloat(values.targetAmount);
  if (!values.targetAmount || isNaN(amount) || amount <= 0) {
    errors.targetAmount = "O valor alvo deve ser maior que zero.";
  }
  if (!accountId) errors.accountId = "Selecione a conta de rendimento.";
  return errors;
}

interface GoalFormProps {
  editing: GoalResponse | null;
  onSave: (payload: GoalRequest) => Promise<void>;
  onCancel: () => void;
}

export function GoalForm({ editing, onSave, onCancel }: GoalFormProps) {
  const { toasts, addToast, dismissToast } = useToastState();
  const [values, setValues] = useState<FormState>({
    name: "",
    description: "",
    targetAmount: "",
    targetDate: "",
    monthlyContribution: "",
    yieldRatePercent: "",
  });
  const [color, setColor] = useState(editing?.color ?? COLORS[6]);
  const [icon, setIcon] = useState<string>(editing?.icon ?? "Target");
  const [accountId, setAccountId] = useState<string>(editing?.vault?.account?.id ?? "");
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAccounts()
      .then((list) => setAccounts(list.filter((a) => a.active)))
      .catch((error) => {
        addToast(getApiErrorMessage(error, "Erro ao carregar contas. Tente novamente."), "error");
      });
  }, [addToast]);

  useEffect(() => {
    if (editing) {
      setValues({
        name: editing.name,
        description: editing.description ?? "",
        targetAmount: String(editing.targetAmount),
        targetDate: editing.targetDate ?? "",
        monthlyContribution: editing.monthlyContribution ? String(editing.monthlyContribution) : "",
        yieldRatePercent: editing.yieldRatePercent ? String(editing.yieldRatePercent) : "",
      });
      setColor(editing.color ?? COLORS[6]);
      setIcon(editing.icon ?? "Target");
      setAccountId(editing.vault?.account?.id ?? "");
    } else {
      setValues({ name: "", description: "", targetAmount: "", targetDate: "", monthlyContribution: "", yieldRatePercent: "" });
      setColor(COLORS[6]);
      setIcon("Target");
      setAccountId("");
    }
    setFieldErrors({});
  }, [editing]);

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleBlur(field: keyof FieldErrors) {
    const errs = validate(values, accountId);
    if (errs[field]) setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values, accountId);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    const payload: GoalRequest = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      targetAmount: parseFloat(values.targetAmount),
      targetDate: values.targetDate || undefined,
      monthlyContribution: values.monthlyContribution ? parseFloat(values.monthlyContribution) : undefined,
      yieldRatePercent: values.yieldRatePercent ? parseFloat(values.yieldRatePercent) : undefined,
      icon,
      color,
      accountId,
    };

    setSaving(true);
    try {
      await onSave(payload);
    } catch (error) {
      addToast(getApiErrorMessage(error, "Erro ao salvar meta. Tente novamente."), "error");
    } finally {
      setSaving(false);
    }
  }

  const isValid = Object.keys(validate(values, accountId)).length === 0;

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Input
        label="Nome da meta"
        placeholder="Ex: Reserva de emergência, Viagem"
        value={values.name}
        onChange={(e) => handleChange("name", e.target.value)}
        onBlur={() => handleBlur("name")}
        error={fieldErrors.name}
      />

      <Input
        label="Descrição (opcional)"
        placeholder="Ex: 6 meses de despesas fixas"
        value={values.description}
        onChange={(e) => handleChange("description", e.target.value)}
      />

      <Input
        label="Valor alvo"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="0,00"
        value={values.targetAmount}
        onChange={(e) => handleChange("targetAmount", e.target.value)}
        onBlur={() => handleBlur("targetAmount")}
        error={fieldErrors.targetAmount}
      />

      {/* conta de rendimento */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Conta de rendimento
        </label>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Onde o dinheiro vai ficar guardado fisicamente.
        </p>
        <select
          value={accountId}
          onChange={(e) => { setAccountId(e.target.value); if (fieldErrors.accountId) setFieldErrors((p) => ({ ...p, accountId: undefined })); }}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:text-zinc-50 dark:focus:border-zinc-500 dark:[color-scheme:dark] ${
            fieldErrors.accountId
              ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
              : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          }`}
        >
          <option value="">Selecionar conta...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bankName ? `${a.bankName} — ${a.name}` : a.name}
            </option>
          ))}
        </select>
        {fieldErrors.accountId && <p className="text-xs text-red-400">{fieldErrors.accountId}</p>}
      </div>

      <DatePicker
        label="Data alvo (opcional)"
        value={values.targetDate}
        onChange={(iso) => handleChange("targetDate", iso ?? "")}
        placeholder="Selecionar data"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Aporte mensal (opcional)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
          value={values.monthlyContribution}
          onChange={(e) => handleChange("monthlyContribution", e.target.value)}
        />
        <Input
          label="Rendimento % a.m. (opcional)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
          value={values.yieldRatePercent}
          onChange={(e) => handleChange("yieldRatePercent", e.target.value)}
        />
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Aporte mensal e rendimento são usados para calcular a projeção de conclusão da meta.
      </p>

      {/* paleta de cores */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Cor</label>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setColor(hex)}
              className="relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: hex }}
              aria-label={hex}
            >
              {color === hex && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* galeria de ícones */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Ícone</label>
        <div className="grid grid-cols-8 gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
          {ICON_NAMES.map((n) => {
            const selected = icon === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setIcon(n)}
                title={n}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  selected ? "scale-110 shadow-sm" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
                style={selected ? { backgroundColor: color } : {}}
              >
                <DynamicIcon
                  name={n}
                  size={16}
                  color={selected ? "#fff" : "#71717a"}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* preview */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: color }}
        >
          <DynamicIcon name={icon} size={16} color="#fff" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {values.name || "Nome da meta"}
          </p>
          {values.description && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{values.description}</p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-zinc-100 bg-white pt-5 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!isValid || saving}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar meta"}
        </button>
      </div>
      </form>
    </>
  );
}
