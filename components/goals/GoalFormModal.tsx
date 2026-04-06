"use client";

import { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import type { GoalRequest, GoalResponse } from "@/types/goals";

// ─── catálogo ─────────────────────────────────────────────────────────────────

const ICON_NAMES = [
  "Target", "Star", "Trophy", "Rocket", "TrendingUp", "BarChart2",
  "Home", "Car", "Plane", "GraduationCap", "Heart", "Shield",
  "Wallet", "PiggyBank", "Coins", "Banknote", "Gift", "Umbrella",
  "Dumbbell", "Music", "BookOpen", "Briefcase", "Building2", "Zap",
] as const;

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#f43f5e", "#a3a3a3",
];

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<LucideProps> | undefined;
  if (!Icon) return <span className="text-[10px] text-zinc-400">{name.slice(0, 2)}</span>;
  return <Icon {...props} />;
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  editing: GoalResponse | null;
  onClose: () => void;
  onSave: (payload: GoalRequest) => Promise<void>;
}

export function GoalFormModal({ editing, onClose, onSave }: Props) {
  const isEdit = !!editing;

  // campos essenciais
  const [name, setName] = useState(editing?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(editing ? String(editing.targetAmount) : "");
  const [targetDate, setTargetDate] = useState(editing?.targetDate ?? "");
  const [color, setColor] = useState(editing?.color ?? COLORS[6]);
  const [icon, setIcon] = useState(editing?.icon ?? "Target");

  // campos avançados
  const [description, setDescription] = useState(editing?.description ?? "");
  const [monthlyContribution, setMonthlyContribution] = useState(
    editing?.monthlyContribution ? String(editing.monthlyContribution) : ""
  );
  const [yieldRatePercent, setYieldRatePercent] = useState(
    editing?.yieldRatePercent ? String(editing.yieldRatePercent) : ""
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [nameError, setNameError] = useState<string>();
  const [amountError, setAmountError] = useState<string>();
  const [saving, setSaving] = useState(false);

  // sincroniza ao trocar a meta em edição
  useEffect(() => {
    setName(editing?.name ?? "");
    setTargetAmount(editing ? String(editing.targetAmount) : "");
    setTargetDate(editing?.targetDate ?? "");
    setColor(editing?.color ?? COLORS[6]);
    setIcon(editing?.icon ?? "Target");
    setDescription(editing?.description ?? "");
    setMonthlyContribution(editing?.monthlyContribution ? String(editing.monthlyContribution) : "");
    setYieldRatePercent(editing?.yieldRatePercent ? String(editing.yieldRatePercent) : "");
    setAdvancedOpen(false);
    setNameError(undefined);
    setAmountError(undefined);
  }, [editing]);

  // ESC fecha
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let valid = true;
    if (!name.trim()) { setNameError("Nome obrigatório."); valid = false; }
    const parsed = parseFloat(targetAmount);
    if (!targetAmount || isNaN(parsed) || parsed <= 0) { setAmountError("Informe um valor maior que zero."); valid = false; }
    if (!valid) return;

    const payload: GoalRequest = {
      name: name.trim(),
      targetAmount: parsed,
      targetDate: targetDate || undefined,
      description: description.trim() || undefined,
      monthlyContribution: monthlyContribution ? parseFloat(monthlyContribution) : undefined,
      yieldRatePercent: yieldRatePercent ? parseFloat(yieldRatePercent) : undefined,
      icon,
      color,
    };

    setSaving(true);
    try {
      await onSave(payload);
    } catch {
      // tratado no pai
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={!saving ? onClose : undefined} />

      <div
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        style={{ maxHeight: "90dvh" }}
      >
        {/* cabeçalho */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {isEdit ? "Editar meta" : "Nova meta"}
          </p>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          {/* ── nome ─────────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Nome</label>
            <input
              type="text"
              placeholder="Ex: Reserva de emergência, Viagem"
              value={name}
              autoFocus
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(undefined); }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 ${
                nameError
                  ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            />
            {nameError && <p className="text-xs text-red-400">{nameError}</p>}
          </div>

          {/* ── valor alvo ───────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Valor alvo</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              value={targetAmount}
              onChange={(e) => { setTargetAmount(e.target.value); if (amountError) setAmountError(undefined); }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 ${
                amountError
                  ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            />
            {amountError && <p className="text-xs text-red-400">{amountError}</p>}
          </div>

          {/* ── data alvo ────────────────────────────────────────────────────── */}
          <DatePicker
            label="Data alvo (opcional)"
            value={targetDate}
            onChange={(iso) => setTargetDate(iso ?? "")}
            placeholder="Selecionar data"
          />

          {/* ── paleta de cores ───────────────────────────────────────────────── */}
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

          {/* ── galeria de ícones ─────────────────────────────────────────────── */}
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
                    <DynamicIcon name={n} size={16} color={selected ? "#fff" : "#71717a"} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── preview ───────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: color }}
            >
              <DynamicIcon name={icon} size={16} color="#fff" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {name || "Nome da meta"}
              </p>
              {targetAmount && !isNaN(parseFloat(targetAmount)) && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Alvo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(targetAmount))}
                  {targetDate && ` · ${targetDate.split("-").reverse().join("/")}`}
                </p>
              )}
            </div>
          </div>

          {/* ── opções avançadas (collapsible) ────────────────────────────────── */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 rounded-xl"
            >
              <span>Opções avançadas de projeção</span>
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
              />
            </button>

            {advancedOpen && (
              <div className="flex flex-col gap-4 border-t border-zinc-200 px-4 pb-4 pt-4 dark:border-zinc-700">
                {/* descrição */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">
                    Descrição <span className="text-zinc-400 dark:text-zinc-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 6 meses de despesas fixas"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* aporte mensal */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">Aporte mensal</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500"
                    />
                  </div>

                  {/* rendimento */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">Rendimento % a.m.</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={yieldRatePercent}
                      onChange={(e) => setYieldRatePercent(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500"
                    />
                  </div>
                </div>

                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Aporte mensal e rendimento são usados para calcular a projeção de conclusão da meta.
                </p>
              </div>
            )}
          </div>

          {/* ── botões ────────────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !targetAmount}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar meta"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
