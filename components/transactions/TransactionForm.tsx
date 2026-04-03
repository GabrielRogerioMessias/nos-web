"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { getCategories } from "@/lib/transactions";
import { getAccounts } from "@/lib/accounts";
import { getCreditCards, createInstallmentPlan } from "@/lib/credit-cards";
import { createRecurringTransaction } from "@/lib/recurring-transactions";
import type {
  TransactionType,
  TransactionRequest,
  TransactionResponse,
  CategoryResponse,
  AccountResponse,
  CreditCardResponse,
  RecurringFrequency,
} from "@/types/dashboard";

type Tab = "EXPENSE" | "INCOME" | "TRANSFER";
type PaymentMethod = "account" | "credit_card";

interface FormState {
  description: string;
  amountDisplay: string; // "R$ 1.500,00" — formatado para exibição
  categoryId: string;
  accountId: string;
  destinationAccountId: string;
  transactionDate: string;
}

interface FieldErrors {
  description?: string;
  amount?: string;
  categoryId?: string;
  accountId?: string;
  destinationAccountId?: string;
  transactionDate?: string;
  creditCardId?: string;
  totalInstallments?: string;
  frequency?: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "EXPENSE", label: "Despesa" },
  { key: "INCOME", label: "Receita" },
  { key: "TRANSFER", label: "Transferência" },
];

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "MONTHLY", label: "Mensal" },
  { value: "YEARLY", label: "Anual" },
];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ─── máscara de moeda ─────────────────────────────────────────────────────────

function maskCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const value = parseInt(digits, 10) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function parseCurrency(display: string): number {
  // "R$ 1.500,50" → 1500.50
  const digits = display.replace(/\D/g, "");
  if (!digits) return NaN;
  return parseInt(digits, 10) / 100;
}

// ─── formatação para edição ───────────────────────────────────────────────────

function amountToDisplay(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── validação ────────────────────────────────────────────────────────────────

function validate(
  values: FormState,
  tab: Tab,
  paymentMethod: PaymentMethod,
  creditCardId: string,
  isInstallment: boolean,
  totalInstallments: string,
  isRecurring: boolean,
  frequency: RecurringFrequency | "",
  accounts: AccountResponse[],
  editing: TransactionResponse | null
): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.description.trim()) errors.description = "Descrição obrigatória.";

  const amount = parseCurrency(values.amountDisplay);
  if (!values.amountDisplay || isNaN(amount) || amount <= 0) {
    errors.amount = "O valor deve ser maior que zero.";
  }

  if (tab !== "TRANSFER" && !values.categoryId) {
    errors.categoryId = "Selecione uma categoria.";
  }

  if (tab === "EXPENSE" && paymentMethod === "credit_card") {
    if (!creditCardId) errors.creditCardId = "Selecione um cartão.";
    if (isInstallment) {
      const n = parseInt(totalInstallments, 10);
      if (!totalInstallments || isNaN(n) || n < 2) {
        errors.totalInstallments = "Informe ao menos 2 parcelas.";
      }
    }
  } else {
    if (!values.accountId) {
      errors.accountId =
        tab === "TRANSFER" ? "Selecione a conta de origem." : "Selecione a conta.";
    }

    // validação de saldo: só para EXPENSE em conta corrente, não recorrente, e somente se o saldo atual for conhecido
    if (tab === "EXPENSE" && !isRecurring && values.accountId && !isNaN(amount) && amount > 0) {
      const account = accounts.find((a) => a.id === values.accountId);
      if (account && account.currentBalance !== null) {
        const originalAmount = editing && editing.type === "EXPENSE" ? editing.amount : 0;
        const balanceAfter = account.currentBalance + originalAmount - amount;
        if (balanceAfter < 0) {
          const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balanceAfter);
          errors.amount = `Saldo insuficiente. Após esta despesa o saldo seria ${formatted} em "${account.name}".`;
        }
      }
    }
  }

  if (tab === "TRANSFER") {
    if (!values.destinationAccountId) {
      errors.destinationAccountId = "Selecione a conta de destino.";
    } else if (values.destinationAccountId === values.accountId) {
      errors.destinationAccountId = "A conta de destino deve ser diferente da origem.";
    }
  }

  if (!values.transactionDate) errors.transactionDate = "Data obrigatória.";

  if (isRecurring && !frequency) {
    errors.frequency = "Selecione a frequência.";
  }

  return errors;
}

// ─── props ────────────────────────────────────────────────────────────────────

interface TransactionFormProps {
  editing?: TransactionResponse | null;
  onSave: (payload: TransactionRequest) => Promise<void>;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function TransactionForm({ editing = null, onSave, onSuccess, onCancel }: TransactionFormProps) {
  const [tab, setTab] = useState<Tab>((editing?.type as Tab) ?? "EXPENSE");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("account");
  const [creditCardId, setCreditCardId] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency | "">("");

  const [values, setValues] = useState<FormState>({
    description: editing?.description ?? "",
    amountDisplay: editing?.amount ? amountToDisplay(editing.amount) : "",
    categoryId: editing?.category?.id ?? "",
    accountId: editing?.account?.id ?? "",
    destinationAccountId: "",
    transactionDate: editing?.transactionDate ?? todayISO(),
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingCats, setLoadingCats] = useState(false);

  // busca categorias ao montar ou ao trocar aba
  useEffect(() => {
    if (tab === "TRANSFER") { setCategories([]); return; }
    setLoadingCats(true);
    if (!editing) setValues((prev) => ({ ...prev, categoryId: "" }));
    getCategories(tab)
      .then(setCategories)
      .finally(() => setLoadingCats(false));
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // busca contas e cartões uma vez ao montar
  useEffect(() => {
    getAccounts().then((data) => setAccounts(data.filter((a) => a.active)));
    getCreditCards().then((data) => setCreditCards(data.filter((c) => c.active)));
  }, []);

  function handleTabChange(next: Tab) {
    if (editing) return;
    setTab(next);
    setFieldErrors({});
    // cartão e recorrência só se aplicam a despesas/receitas (não transferência)
    if (next === "TRANSFER") {
      setPaymentMethod("account");
      setCreditCardId("");
      setIsInstallment(false);
      setTotalInstallments("");
      setIsRecurring(false);
      setFrequency("");
    }
    // cartão só para despesas
    if (next !== "EXPENSE") {
      setPaymentMethod("account");
      setCreditCardId("");
      setIsInstallment(false);
      setTotalInstallments("");
    }
  }

  function handlePaymentMethodChange(method: PaymentMethod) {
    setPaymentMethod(method);
    setFieldErrors({});
    if (method === "account") {
      setCreditCardId("");
      setIsInstallment(false);
      setTotalInstallments("");
    }
  }

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleAmountChange(raw: string) {
    const masked = maskCurrency(raw);
    setValues((prev) => ({ ...prev, amountDisplay: masked }));
    if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: undefined }));
  }

  function handleBlur(field: keyof FieldErrors) {
    const errs = validate(values, tab, paymentMethod, creditCardId, isInstallment, totalInstallments, isRecurring, frequency, accounts, editing);
    if (errs[field]) setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values, tab, paymentMethod, creditCardId, isInstallment, totalInstallments, isRecurring, frequency, accounts, editing);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    const amount = parseCurrency(values.amountDisplay);

    setSaving(true);
    try {
      // Cenário: transação recorrente
      if (isRecurring && tab !== "TRANSFER") {
        await createRecurringTransaction({
          description: values.description.trim(),
          amount,
          type: tab as TransactionType,
          categoryId: values.categoryId,
          accountId: values.accountId || undefined,
          frequency: frequency as RecurringFrequency,
          startDate: values.transactionDate,
        });
        window.dispatchEvent(new CustomEvent("transaction-updated"));
        onSuccess?.();
        return;
      }

      // Cenário: cartão parcelado
      if (tab === "EXPENSE" && paymentMethod === "credit_card" && isInstallment) {
        await createInstallmentPlan({
          description: values.description.trim(),
          totalAmount: amount,
          totalInstallments: parseInt(totalInstallments, 10),
          creditCardId,
          categoryId: values.categoryId,
          firstInstallmentDate: values.transactionDate,
        });
        window.dispatchEvent(new CustomEvent("transaction-updated"));
        onSuccess?.();
        return;
      }

      // Cenário: cartão à vista (fix #1 — creditCardId separado de accountId)
      // Cenário: conta corrente / receita / transferência
      const payload: TransactionRequest =
        tab === "TRANSFER"
          ? {
              type: "TRANSFER",
              description: values.description.trim(),
              amount,
              accountId: values.accountId,
              destinationAccountId: values.destinationAccountId,
              transactionDate: values.transactionDate,
            }
          : tab === "EXPENSE" && paymentMethod === "credit_card"
          ? {
              type: "EXPENSE",
              description: values.description.trim(),
              amount,
              categoryId: values.categoryId,
              creditCardId,
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

      await onSave(payload);
      // evento disparado após sucesso (o pai fecha o SlideOver)
      window.dispatchEvent(new CustomEvent("transaction-updated"));
    } catch {
      // erro tratado no pai
    } finally {
      setSaving(false);
    }
  }

  const errs = validate(values, tab, paymentMethod, creditCardId, isInstallment, totalInstallments, isRecurring, frequency, accounts, editing);
  const isValid = Object.keys(errs).length === 0;

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const creditCardOptions = creditCards.map((c) => ({ value: c.id, label: c.name }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const frequencyOptions = FREQUENCY_OPTIONS.map((f) => ({ value: f.value, label: f.label }));

  // cartão parcelado e recorrentes não são combináveis com edição
  const showRecurringOption = tab !== "TRANSFER" && !editing;
  const showCardToggle = tab === "EXPENSE" && !isRecurring && !editing;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
      {/* área de scroll com os inputs */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto pb-4">
        {/* abas */}
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

        {/* valor com máscara de moeda */}
        <Input
          label="Valor"
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={values.amountDisplay}
          onChange={(e) => handleAmountChange(e.target.value)}
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
              <p className="text-xs text-zinc-400">Nenhuma categoria cadastrada para este tipo.</p>
            )}
          </div>
        )}

        {/* toggle forma de pagamento — só para despesas não-recorrentes */}
        {showCardToggle && (
          <div className="flex flex-col gap-3">
            <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              <button
                type="button"
                onClick={() => handlePaymentMethodChange("account")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  paymentMethod === "account"
                    ? "bg-white text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Conta corrente
              </button>
              <button
                type="button"
                onClick={() => handlePaymentMethodChange("credit_card")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  paymentMethod === "credit_card"
                    ? "bg-white text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Cartão de crédito
              </button>
            </div>

            {paymentMethod === "account" && (
              <Select
                label="Conta"
                options={accountOptions}
                value={values.accountId}
                onChange={(e) => handleChange("accountId", e.target.value)}
                onBlur={() => handleBlur("accountId")}
                error={fieldErrors.accountId}
              />
            )}

            {paymentMethod === "credit_card" && (
              <div className="flex flex-col gap-3">
                <Select
                  label="Cartão"
                  options={creditCardOptions}
                  value={creditCardId}
                  onChange={(e) => {
                    setCreditCardId(e.target.value);
                    if (fieldErrors.creditCardId) setFieldErrors((prev) => ({ ...prev, creditCardId: undefined }));
                  }}
                  onBlur={() => handleBlur("creditCardId")}
                  error={fieldErrors.creditCardId}
                />

                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => {
                      setIsInstallment(e.target.checked);
                      if (!e.target.checked) {
                        setTotalInstallments("");
                        setFieldErrors((prev) => ({ ...prev, totalInstallments: undefined }));
                      }
                    }}
                    className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-500">Compra parcelada</span>
                </label>

                {isInstallment && (
                  <Input
                    label="Em quantas vezes?"
                    type="number"
                    min="2"
                    step="1"
                    placeholder="Ex: 6"
                    value={totalInstallments}
                    onChange={(e) => {
                      setTotalInstallments(e.target.value);
                      if (fieldErrors.totalInstallments) setFieldErrors((prev) => ({ ...prev, totalInstallments: undefined }));
                    }}
                    onBlur={() => handleBlur("totalInstallments")}
                    error={fieldErrors.totalInstallments}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* conta para receita */}
        {tab === "INCOME" && (
          <Select
            label="Conta"
            options={accountOptions}
            value={values.accountId}
            onChange={(e) => handleChange("accountId", e.target.value)}
            onBlur={() => handleBlur("accountId")}
            error={fieldErrors.accountId}
          />
        )}

        {/* contas para transferência */}
        {tab === "TRANSFER" && (
          <>
            <Select
              label="Conta de origem"
              options={accountOptions}
              value={values.accountId}
              onChange={(e) => handleChange("accountId", e.target.value)}
              onBlur={() => handleBlur("accountId")}
              error={fieldErrors.accountId}
            />
            <Select
              label="Conta de destino"
              options={accountOptions.filter((o) => o.value !== values.accountId)}
              value={values.destinationAccountId}
              onChange={(e) => handleChange("destinationAccountId", e.target.value)}
              onBlur={() => handleBlur("destinationAccountId")}
              error={fieldErrors.destinationAccountId}
            />
          </>
        )}

        {/* conta para despesa recorrente (quando cartão não selecionado) */}
        {tab === "EXPENSE" && isRecurring && (
          <Select
            label="Conta"
            options={accountOptions}
            value={values.accountId}
            onChange={(e) => handleChange("accountId", e.target.value)}
            onBlur={() => handleBlur("accountId")}
            error={fieldErrors.accountId}
          />
        )}

        {/* transação recorrente */}
        {showRecurringOption && (
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (!e.target.checked) {
                    setFrequency("");
                    setFieldErrors((prev) => ({ ...prev, frequency: undefined }));
                  } else {
                    // ao marcar recorrente, volta para conta corrente
                    setPaymentMethod("account");
                    setCreditCardId("");
                    setIsInstallment(false);
                    setTotalInstallments("");
                  }
                }}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <span className="text-sm text-zinc-500">É uma transação fixa/recorrente</span>
            </label>

            {isRecurring && (
              <Select
                label="Frequência"
                options={frequencyOptions}
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value as RecurringFrequency);
                  if (fieldErrors.frequency) setFieldErrors((prev) => ({ ...prev, frequency: undefined }));
                }}
                onBlur={() => handleBlur("frequency")}
                error={fieldErrors.frequency}
              />
            )}
          </div>
        )}
      </div>

      {/* botões — fixos no rodapé */}
      <div className="sticky bottom-0 mt-auto flex gap-3 border-t border-zinc-100 bg-white pt-4">
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
