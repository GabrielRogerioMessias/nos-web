"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AccountRequest, AccountResponse, AccountType } from "@/types/dashboard";

function maskCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const value = parseInt(digits, 10) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(value);
}

function parseCurrency(display: string): number {
  const digits = display.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "CHECKING", label: "Conta Corrente" },
  { value: "SAVINGS", label: "Poupança" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "WALLET", label: "Carteira" },
];

const COLOR_OPTIONS = [
  "#18181b", "#3f3f46", "#71717a", "#a1a1aa",
  "#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899",
  "#f59e0b", "#10b981",
];

interface FormState {
  name: string;
  type: AccountType | "";
  bankName: string;
  initialBalance: string;
  color: string;
}

interface FieldErrors {
  name?: string;
  type?: string;
}

function validate(values: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "O nome da conta é obrigatório.";
  if (!values.type) errors.type = "Selecione o tipo de conta.";
  return errors;
}

interface AccountFormProps {
  editing: AccountResponse | null;
  onSave: (payload: AccountRequest) => Promise<void>;
  onCancel: () => void;
}

export function AccountForm({ editing, onSave, onCancel }: AccountFormProps) {
  const [values, setValues] = useState<FormState>({
    name: "",
    type: "",
    bankName: "",
    initialBalance: "0",
    color: COLOR_OPTIONS[0],
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  // preenche o formulário ao editar
  useEffect(() => {
    if (editing) {
      setValues({
        name: editing.name,
        type: editing.type as AccountType,
        bankName: editing.bankName ?? "",
        initialBalance: maskCurrency(String(Math.round((editing.initialBalance ?? 0) * 100))),
        color: editing.color ?? COLOR_OPTIONS[0],
      });
    } else {
      setValues({ name: "", type: "", bankName: "", initialBalance: "", color: COLOR_OPTIONS[0] });
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
    const errors = validate(values);
    if (errors[field]) setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(values);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    const payload: AccountRequest = {
      name: values.name.trim(),
      type: values.type as AccountType,
      bankName: values.bankName.trim() || undefined,
      initialBalance: parseCurrency(values.initialBalance),
      color: values.color,
    };

    setSaving(true);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  }

  const isValid = values.name.trim() !== "" && values.type !== "";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col gap-5">
      <Input
        label="Nome da conta"
        placeholder="Ex: Nubank, Carteira"
        value={values.name}
        onChange={(e) => handleChange("name", e.target.value)}
        onBlur={() => handleBlur("name")}
        error={fieldErrors.name}
      />

      <Select
        label="Tipo"
        options={ACCOUNT_TYPE_OPTIONS}
        value={values.type}
        onChange={(e) => handleChange("type", e.target.value)}
        onBlur={() => handleBlur("type")}
        error={fieldErrors.type}
      />

      <Input
        label="Banco (opcional)"
        placeholder="Ex: Nubank, Itaú"
        value={values.bankName}
        onChange={(e) => handleChange("bankName", e.target.value)}
      />

      {/* saldo inicial — desabilitado na edição */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Saldo inicial</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={values.initialBalance}
          onChange={(e) => handleChange("initialBalance", maskCurrency(e.target.value))}
          disabled={!!editing}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 ${
            editing ? "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          }`}
        />
        {editing && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Para ajustar o saldo de contas ativas, crie uma transação de Ajuste.
          </p>
        )}
      </div>

      {/* seletor de cor */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Cor</span>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleChange("color", c)}
              className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none ${
                values.color === c ? "scale-110" : ""
              }`}
              style={{ backgroundColor: c }}
            >
              {values.color === c && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ações */}
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
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar conta"}
        </button>
      </div>
    </form>
  );
}
