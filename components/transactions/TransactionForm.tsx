"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { getCategories } from "@/lib/transactions";
import { getAccounts } from "@/lib/accounts";
import type {
  TransactionType,
  TransactionRequest,
  TransactionResponse,
  CategoryResponse,
  AccountResponse,
} from "@/types/dashboard";

type Tab = "EXPENSE" | "INCOME" | "TRANSFER";

interface FormState {
  description: string;
  amount: string;
  categoryId: string;
  accountId: string;
  destAccountId: string;
  transactionDate: string;
}

interface FieldErrors {
  description?: string;
  amount?: string;
  categoryId?: string;
  accountId?: string;
  destAccountId?: string;
  transactionDate?: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "EXPENSE", label: "Despesa" },
  { key: "INCOME", label: "Receita" },
  { key: "TRANSFER", label: "Transferência" },
];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function validate(
  values: FormState,
  tab: Tab,
  accounts: AccountResponse[],
  editing: TransactionResponse | null
): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.description.trim()) errors.description = "Descrição obrigatória.";

  const amount = parseFloat(values.amount);
  if (!values.amount || isNaN(amount) || amount <= 0) {
    errors.amount = "O valor deve ser maior que zero.";
  }

  if (tab !== "TRANSFER" && !values.categoryId) {
    errors.categoryId = "Selecione uma categoria.";
  }

  if (!values.accountId) {
    errors.accountId = tab === "TRANSFER" ? "Selecione a conta de origem." : "Selecione a conta.";
  }

  // validação de saldo: só para EXPENSE, quando há conta selecionada
  if (tab === "EXPENSE" && values.accountId && !isNaN(amount) && amount > 0) {
    const account = accounts.find((a) => a.id === values.accountId);
    if (account) {
      // ao editar, devolve o valor original antes de comparar
      const originalAmount = editing && editing.type === "EXPENSE" ? editing.amount : 0;
      const balanceAfter = account.currentBalance + originalAmount - amount;
      if (balanceAfter < 0) {
        errors.amount = `Saldo insuficiente. Após esta despesa o saldo seria ${formatCurrency(balanceAfter)} em "${account.name}".`;
      }
    }
  }

  if (tab === "TRANSFER") {
    if (!values.destAccountId) {
      errors.destAccountId = "Selecione a conta de destino.";
    } else if (values.destAccountId === values.accountId) {
      errors.destAccountId = "A conta de destino deve ser diferente da origem.";
    }
  }

  if (!values.transactionDate) errors.transactionDate = "Data obrigatória.";

  return errors;
}

interface TransactionFormProps {
  editing?: TransactionResponse | null;
  onSave: (payload: TransactionRequest) => Promise<void>;
  onCancel: () => void;
}

export function TransactionForm({ editing = null, onSave, onCancel }: TransactionFormProps) {
  const [tab, setTab] = useState<Tab>((editing?.type as Tab) ?? "EXPENSE");
  const [values, setValues] = useState<FormState>({
    description: editing?.description ?? "",
    amount: editing?.amount ? String(editing.amount) : "",
    categoryId: editing?.category?.id ?? "",
    accountId: editing?.account?.id ?? "",
    destAccountId: "",
    transactionDate: editing?.transactionDate ?? todayISO(),
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingCats, setLoadingCats] = useState(false);

  // busca categorias ao montar ou ao trocar aba
  useEffect(() => {
    if (tab === "TRANSFER") { setCategories([]); return; }
    setLoadingCats(true);
    // ao criar: limpa categoryId. ao editar: mantém o atual
    if (!editing) setValues((prev) => ({ ...prev, categoryId: "" }));
    getCategories(tab)
      .then(setCategories)
      .finally(() => setLoadingCats(false));
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getAccounts().then((data) => setAccounts(data.filter((a) => a.active)));
  }, []);

  function handleTabChange(next: Tab) {
    if (editing) return; // aba bloqueada na edição
    setTab(next);
    setFieldErrors({});
  }

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleBlur(field: keyof FieldErrors) {
    const errs = validate(values, tab, accounts, editing);
    if (errs[field]) setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values, tab, accounts, editing);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    const amount = parseFloat(values.amount);
    const payload: TransactionRequest =
      tab === "TRANSFER"
        ? {
            type: "TRANSFER",
            description: values.description.trim(),
            amount,
            categoryId: "",
            accountId: values.accountId,
            transactionDate: values.transactionDate,
          }
        : {
            type: tab as TransactionType,
            description: values.description.trim(),
            amount,
            categoryId: values.categoryId,
            accountId: values.accountId || undefined,
            transactionDate: values.transactionDate,
          };

    setSaving(true);
    try {
      await onSave(payload);
    } catch {
      // erro tratado no pai
    } finally {
      setSaving(false);
    }
  }

  const errs = validate(values, tab, accounts, editing);
  const isValid = Object.keys(errs).length === 0;
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* abas — desabilitadas na edição */}
      <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleTabChange(key)}
            disabled={!!editing}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Input
        label="Descrição"
        placeholder="Ex: Supermercado, Salário"
        value={values.description}
        onChange={(e) => handleChange("description", e.target.value)}
        onBlur={() => handleBlur("description")}
        error={fieldErrors.description}
      />

      <Input
        label="Valor"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="0,00"
        value={values.amount}
        onChange={(e) => handleChange("amount", e.target.value)}
        onBlur={() => handleBlur("amount")}
        error={fieldErrors.amount}
      />

      <DatePicker
        label="Data"
        value={values.transactionDate}
        onChange={(iso) => {
          handleChange("transactionDate", iso ?? "");
          handleBlur("transactionDate");
        }}
        error={fieldErrors.transactionDate}
      />

      {tab !== "TRANSFER" && (
        <div className="flex flex-col gap-1.5">
          <Select
            label="Categoria"
            options={loadingCats ? [] : categoryOptions}
            value={values.categoryId}
            onChange={(e) => handleChange("categoryId", e.target.value)}
            onBlur={() => handleBlur("categoryId")}
            error={fieldErrors.categoryId}
            disabled={loadingCats || categories.length === 0}
          />
          {!loadingCats && categories.length === 0 && (
            <p className="text-xs text-zinc-400">
              Nenhuma categoria cadastrada para este tipo.
            </p>
          )}
        </div>
      )}

      <Select
        label={tab === "TRANSFER" ? "Conta de origem" : "Conta"}
        options={accountOptions}
        value={values.accountId}
        onChange={(e) => handleChange("accountId", e.target.value)}
        onBlur={() => handleBlur("accountId")}
        error={fieldErrors.accountId}
      />

      {tab === "TRANSFER" && (
        <Select
          label="Conta de destino"
          options={accountOptions}
          value={values.destAccountId}
          onChange={(e) => handleChange("destAccountId", e.target.value)}
          onBlur={() => handleBlur("destAccountId")}
          error={fieldErrors.destAccountId}
        />
      )}

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
          {saving ? "Salvando..." : editing ? "Salvar alterações" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
