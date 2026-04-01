"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AccountRequest, AccountResponse, AccountType } from "@/types/dashboard";

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
        initialBalance: String(editing.initialBalance ?? 0),
        color: editing.color ?? COLOR_OPTIONS[0],
      });
    } else {
      setValues({ name: "", type: "", bankName: "", initialBalance: "0", color: COLOR_OPTIONS[0] });
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
      initialBalance: parseFloat(values.initialBalance) || 0,
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
        <label className="text-sm text-zinc-600">Saldo inicial</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={values.initialBalance}
          onChange={(e) => handleChange("initialBalance", e.target.value)}
          disabled={!!editing}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
        />
        {editing && (
          <p className="text-xs text-zinc-400">
            Para ajustar o saldo de contas ativas, crie uma transação de Ajuste.
          </p>
        )}
      </div>

      {/* seletor de cor */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-zinc-600">Cor</span>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleChange("color", c)}
              className={`h-6 w-6 rounded-full border-2 transition-all ${
                values.color === c ? "border-zinc-900 scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* ações */}
      <div className="mt-2 flex gap-3 border-t border-zinc-100 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!isValid || saving}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar conta"}
        </button>
      </div>
    </form>
  );
}
