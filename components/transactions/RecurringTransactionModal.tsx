"use client";

import { useEffect, useState } from "react";
import { X, Calendar, RefreshCw } from "lucide-react";
import { createRecurringTransaction } from "@/lib/recurring-transactions";
import { getAccounts } from "@/lib/accounts";
import { getCategories } from "@/lib/transactions";
import type { AccountResponse, CategoryResponse, RecurringFrequency } from "@/types/dashboard";

// ─── helpers ──────────────────────────────────────────────────────────────────

function maskCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(masked: string): number {
  return parseFloat(masked.replace(/\./g, "").replace(",", ".")) || 0;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── constantes ───────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "DAILY",      label: "Diária" },
  { value: "WEEKLY",     label: "Semanal" },
  { value: "BIWEEKLY",   label: "Quinzenal" },
  { value: "MONTHLY",    label: "Mensal" },
  { value: "BIMONTHLY",  label: "Bimestral" },
  { value: "QUARTERLY",  label: "Trimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL",     label: "Anual" },
];

const FREQUENCY_LABEL: Record<RecurringFrequency, string> = Object.fromEntries(
  FREQUENCY_OPTIONS.map((f) => [f.value, f.label])
) as Record<RecurringFrequency, string>;

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

// ─── erros ───────────────────────────────────────────────────────────────────

interface Errors {
  description?: string;
  amount?: string;
  categoryId?: string;
  accountId?: string;
  startDate?: string;
}

// ─── componente ──────────────────────────────────────────────────────────────

export function RecurringTransactionModal({ onClose, onSuccess }: Props) {
  // form state
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [description, setDescription] = useState("");
  const [amountMasked, setAmountMasked] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("MONTHLY");
  const [startDate, setStartDate] = useState(todayISO());
  const [payFirstInstallmentNow, setPayFirstInstallmentNow] = useState(false);

  // remote data
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // ui state
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string>();

  // load accounts + categories
  useEffect(() => {
    getAccounts()
      .then((list) => setAccounts(list.filter((a) => a.active)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getCategories(type)
      .then(setCategories)
      .catch(() => {});
    setCategoryId("");
  }, [type]);

  // esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  function validate(): boolean {
    const errs: Errors = {};
    if (!description.trim()) errs.description = "Descrição obrigatória.";
    if (parseCurrency(amountMasked) <= 0) errs.amount = "Informe um valor maior que zero.";
    if (!categoryId) errs.categoryId = "Selecione uma categoria.";
    if (!accountId) errs.accountId = "Selecione a conta bancária.";
    if (!startDate) errs.startDate = "Informe a data de vencimento.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError(undefined);
    try {
      await createRecurringTransaction({
        type,
        description: description.trim(),
        amount: parseCurrency(amountMasked),
        categoryId,
        accountId,
        frequency,
        startDate,
        payFirstInstallmentNow,
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setApiError(axiosErr.response?.data?.message ?? "Erro ao criar assinatura.");
    } finally {
      setSaving(false);
    }
  }

  const selectedFreqLabel = FREQUENCY_LABEL[frequency];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={!saving ? onClose : undefined} />

      <div
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        style={{ maxHeight: "92dvh" }}
      >
        {/* ── cabeçalho ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-zinc-100 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <RefreshCw size={15} className="text-zinc-500 dark:text-zinc-400" />
            </span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Nova Assinatura</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-5">

          {/* ── tipo: EXPENSE / INCOME ── */}
          <div className="flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg py-2 text-sm transition-all ${
                  type === t
                    ? t === "EXPENSE"
                      ? "bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                      : "bg-white font-semibold text-emerald-600 shadow-sm dark:bg-zinc-700 dark:text-emerald-400"
                    : "font-medium text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {t === "EXPENSE" ? "Despesa" : "Receita"}
              </button>
            ))}
          </div>

          {/* ── descrição ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Descrição</label>
            <input
              type="text"
              autoFocus
              placeholder="Ex: Netflix, Spotify, Aluguel…"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })); }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 ${
                errors.description
                  ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            />
            {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
          </div>

          {/* ── valor ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Valor</label>
            <div className={`flex items-center rounded-lg border transition-colors focus-within:border-zinc-400 dark:focus-within:border-zinc-500 ${
              errors.amount
                ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            }`}>
              <span className="pl-3.5 text-sm text-zinc-400 dark:text-zinc-500">R$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amountMasked}
                onChange={(e) => { setAmountMasked(maskCurrency(e.target.value)); setErrors((p) => ({ ...p, amount: undefined })); }}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
          </div>

          {/* ── categoria ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setErrors((p) => ({ ...p, categoryId: undefined })); }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:text-zinc-50 dark:focus:border-zinc-500 dark:[color-scheme:dark] ${
                errors.categoryId
                  ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <option value="">Selecionar categoria...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-400">{errors.categoryId}</p>}
          </div>

          {/* ── conta bancária ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Conta bancária</label>
            <select
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); setErrors((p) => ({ ...p, accountId: undefined })); }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:text-zinc-50 dark:focus:border-zinc-500 dark:[color-scheme:dark] ${
                errors.accountId
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
            {errors.accountId && <p className="text-xs text-red-400">{errors.accountId}</p>}
          </div>

          {/* ── frequência + vencimento ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">Frequência</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:[color-scheme:dark]"
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">Vencimento</label>
              <div className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 transition-colors focus-within:border-zinc-400 dark:focus-within:border-zinc-500 ${
                errors.startDate
                  ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}>
                <Calendar size={14} className="flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({ ...p, startDate: undefined })); }}
                  className="w-full bg-transparent text-sm text-zinc-900 outline-none dark:text-zinc-50 dark:[color-scheme:dark]"
                />
              </div>
              {errors.startDate && <p className="text-xs text-red-400">{errors.startDate}</p>}
            </div>
          </div>

          {/* ── preview da recorrência ── */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700">
              <RefreshCw size={13} className="text-zinc-500 dark:text-zinc-400" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {description.trim() || "Assinatura"}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {selectedFreqLabel} · vence em{" "}
                {startDate
                  ? new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                  : "—"}
              </p>
            </div>
            {amountMasked && (
              <p className={`ml-auto flex-shrink-0 text-sm font-bold tabular-nums ${
                type === "INCOME" ? "text-emerald-500" : "text-zinc-900 dark:text-zinc-50"
              }`}>
                {type === "INCOME" ? "+ " : "– "}R$ {amountMasked}
              </p>
            )}
          </div>

          {/* ── pagar agora ── */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/60">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={payFirstInstallmentNow}
                onChange={(e) => setPayFirstInstallmentNow(e.target.checked)}
                className="peer sr-only"
              />
              <div className={`h-5 w-5 rounded-md border-2 transition-colors ${
                payFirstInstallmentNow
                  ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
                  : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
              }`}>
                {payFirstInstallmentNow && (
                  <svg viewBox="0 0 10 8" className="h-full w-full p-0.5" fill="none">
                    <path d="M1 4l3 3 5-6" stroke={typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "#18181b" : "white"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Registrar primeiro pagamento agora
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                Gera uma transação de hoje e agenda o próximo vencimento para {selectedFreqLabel.toLowerCase()} após a data informada.
              </p>
            </div>
          </label>

          {/* ── erro de API ── */}
          {apiError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-500 dark:bg-red-950/40 dark:text-red-400">
              {apiError}
            </p>
          )}

          {/* ── botões ── */}
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
              disabled={saving}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Salvando..." : "Criar assinatura"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
