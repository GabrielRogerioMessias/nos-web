"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import type { CreditCardRequest, CreditCardResponse } from "@/types/dashboard";

const COLOR_OPTIONS = [
  "#18181b", "#3f3f46", "#71717a", "#a1a1aa",
  "#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899",
  "#f59e0b", "#10b981",
];

const BRAND_OPTIONS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard", "Outro"];

interface FormState {
  name: string;
  brand: string;
  closingDay: string;
  dueDay: string;
  creditLimit: string;
  color: string;
}

interface FieldErrors {
  name?: string;
  closingDay?: string;
  dueDay?: string;
}

function validate(values: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Nome do cartão é obrigatório.";
  }

  const closing = parseInt(values.closingDay);
  const due = parseInt(values.dueDay);

  if (!values.closingDay || isNaN(closing) || closing < 1 || closing > 31) {
    errors.closingDay = "Informe um dia válido (1–31).";
  }

  if (!values.dueDay || isNaN(due) || due < 1 || due > 31) {
    errors.dueDay = "Informe um dia válido (1–31).";
  }

  if (!errors.closingDay && !errors.dueDay && closing >= due) {
    errors.dueDay = "O vencimento deve ser posterior ao fechamento.";
  }

  return errors;
}

interface CreditCardFormProps {
  editing: CreditCardResponse | null;
  onSave: (payload: CreditCardRequest) => Promise<void>;
  onCancel: () => void;
}

export function CreditCardForm({ editing, onSave, onCancel }: CreditCardFormProps) {
  const [values, setValues] = useState<FormState>({
    name: "",
    brand: "",
    closingDay: "",
    dueDay: "",
    creditLimit: "",
    color: COLOR_OPTIONS[0],
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setValues({
        name: editing.name,
        brand: editing.brand ?? "",
        closingDay: String(editing.closingDay),
        dueDay: String(editing.dueDay),
        creditLimit: editing.creditLimit ? String(editing.creditLimit) : "",
        color: editing.color ?? COLOR_OPTIONS[0],
      });
    } else {
      setValues({ name: "", brand: "", closingDay: "", dueDay: "", creditLimit: "", color: COLOR_OPTIONS[0] });
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
    const errs = validate(values);
    if (errs[field]) setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    const payload: CreditCardRequest = {
      name: values.name.trim(),
      brand: values.brand || undefined,
      closingDay: parseInt(values.closingDay),
      dueDay: parseInt(values.dueDay),
      creditLimit: values.creditLimit ? parseFloat(values.creditLimit) : undefined,
      color: values.color,
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

  const isValid = Object.keys(validate(values)).length === 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Input
        label="Nome do cartão"
        placeholder="Ex: Nubank, Inter Gold"
        value={values.name}
        onChange={(e) => handleChange("name", e.target.value)}
        onBlur={() => handleBlur("name")}
        error={fieldErrors.name}
      />

      {/* bandeira */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-zinc-600">Bandeira</label>
        <div className="flex flex-wrap gap-2">
          {BRAND_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => handleChange("brand", values.brand === b ? "" : b)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                values.brand === b
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Dia de fechamento"
          type="number"
          min="1"
          max="31"
          placeholder="Ex: 20"
          value={values.closingDay}
          onChange={(e) => handleChange("closingDay", e.target.value)}
          onBlur={() => handleBlur("closingDay")}
          error={fieldErrors.closingDay}
        />
        <Input
          label="Dia de vencimento"
          type="number"
          min="1"
          max="31"
          placeholder="Ex: 27"
          value={values.dueDay}
          onChange={(e) => handleChange("dueDay", e.target.value)}
          onBlur={() => handleBlur("dueDay")}
          error={fieldErrors.dueDay}
        />
      </div>

      <Input
        label="Limite (opcional)"
        type="number"
        min="0"
        step="0.01"
        placeholder="0,00"
        value={values.creditLimit}
        onChange={(e) => handleChange("creditLimit", e.target.value)}
      />

      {/* cor */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-zinc-600">Cor</span>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleChange("color", c)}
              className={`h-6 w-6 rounded-full transition-all ${
                values.color === c
                  ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                  : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto flex gap-3 border-t border-zinc-100 bg-white pt-5 dark:border-zinc-800 dark:bg-zinc-950">
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
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar cartão"}
        </button>
      </div>
    </form>
  );
}
