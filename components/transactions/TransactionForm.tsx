"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ColorSelect } from "@/components/ui/ColorSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import { getCategories } from "@/lib/transactions";
import { getAccounts } from "@/lib/accounts";
import { Building2, CreditCard as CreditCardIcon, Layers, AlertTriangle, X } from "lucide-react";
import { getCreditCards, createInstallmentPlan } from "@/lib/credit-cards";
import { getVaults, withdrawFromVault, type VaultResponse } from "@/lib/vaults";
import type {
  TransactionType,
  TransactionRequest,
  TransactionResponse,
  CategoryResponse,
  AccountResponse,
  CreditCardResponse,
} from "@/types/dashboard";

type Tab = "EXPENSE" | "INCOME" | "TRANSFER";
type PaymentMethod = "account" | "credit_card";

interface FormState {
  description: string;
  amountDisplay: string;
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
}

const TABS: { key: Tab; label: string }[] = [
  { key: "EXPENSE", label: "Despesa" },
  { key: "INCOME", label: "Receita" },
  { key: "TRANSFER", label: "Transferência" },
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
  const digits = display.replace(/\D/g, "");
  if (!digits) return NaN;
  return parseInt(digits, 10) / 100;
}

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
  isEditingCardExpense: boolean,
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
  } else if (isEditingCardExpense) {
    // edição de despesa de cartão: account é null na resposta, não exigir accountId
  } else {
    if (!values.accountId) {
      errors.accountId =
        tab === "TRANSFER" ? "Selecione a conta de origem." : "Selecione a conta.";
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

  // ─── intervenção de saldo insuficiente ────────────────────────────────────
  const [intervention, setIntervention] = useState<{
    pendingPayload: TransactionRequest;
    shortfall: number;
    vaults: VaultResponse[];
    selectedVaultId: string;
  } | null>(null);

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

  // executa a transação (após decisão do modal ou fluxo normal)
  async function commitTransaction(payload: TransactionRequest) {
    await onSave(payload);
    window.dispatchEvent(new CustomEvent("transaction-updated"));
    onSuccess?.();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values, tab, paymentMethod, creditCardId, isInstallment, totalInstallments, isEditingCardExpense);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    const amount = parseCurrency(values.amountDisplay);

    setSaving(true);
    try {
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
          : tab === "EXPENSE" && paymentMethod === "credit_card" && !isEditingCardExpense
          ? {
              type: "EXPENSE",
              description: values.description.trim(),
              amount,
              categoryId: values.categoryId,
              creditCardId,
              transactionDate: values.transactionDate,
            }
          : isEditingCardExpense
          ? {
              type: "EXPENSE",
              description: values.description.trim(),
              amount,
              categoryId: values.categoryId,
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

      // ── intervenção de saldo insuficiente ────────────────────────────────
      // só para despesas via conta, criação nova
      if (
        tab === "EXPENSE" &&
        paymentMethod === "account" &&
        !editing &&
        values.accountId
      ) {
        const account = accounts.find((a) => a.id === values.accountId);
        const balance = account?.currentBalance ?? 0;
        if (amount > balance) {
          const shortfall = amount - balance;
          const allVaults = await getVaults().catch(() => [] as VaultResponse[]);
          const eligibleVaults = allVaults.filter(
            (v) =>
              v.vaultType === "GENERAL" &&
              v.account?.id === values.accountId &&
              v.currentBalance >= shortfall
          );
          setIntervention({
            pendingPayload: payload,
            shortfall,
            vaults: eligibleVaults,
            selectedVaultId: eligibleVaults[0]?.id ?? "",
          });
          return;
        }
      }

      await commitTransaction(payload);
    } catch {
      // erro tratado no pai
    } finally {
      setSaving(false);
    }
  }

  // Opção A: resgatar do cofre e pagar
  async function handleVaultRescue() {
    if (!intervention) return;
    setSaving(true);
    try {
      await withdrawFromVault(
        intervention.selectedVaultId,
        intervention.shortfall,
        intervention.pendingPayload.accountId!,
      );
      await commitTransaction(intervention.pendingPayload);
      setIntervention(null);
    } catch {
      // erro tratado no pai
    } finally {
      setSaving(false);
    }
  }

  // Opção B: cheque especial — prossegue normalmente
  async function handleOverdraft() {
    if (!intervention) return;
    setSaving(true);
    try {
      await commitTransaction(intervention.pendingPayload);
      setIntervention(null);
    } catch {
      // erro tratado no pai
    } finally {
      setSaving(false);
    }
  }

  // despesa de cartão de crédito na edição
  const isEditingCardExpense = !!editing && editing.type === "EXPENSE" && editing.account === null;

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name, color: a.color }));
  const creditCardOptions = creditCards.map((c) => ({ value: c.id, label: c.name, color: c.color }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const showCardToggle = tab === "EXPENSE" && !editing;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto pb-4">

        {/* 1. TIPO */}
        <div className="mb-2 flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              disabled={!!editing}
              className={`flex-1 rounded-lg py-2.5 text-sm transition-all ${
                tab === key
                  ? "bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-zinc-50"
                  : "font-medium text-zinc-400 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 2. FORMA DE PAGAMENTO — só para despesas */}
        {showCardToggle && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Forma de pagamento</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("account")}
                  className={`flex flex-1 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                    paymentMethod === "account"
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
                  }`}
                >
                  <Building2 size={15} className="flex-shrink-0" />
                  Conta
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("credit_card")}
                  className={`flex flex-1 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                    paymentMethod === "credit_card"
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
                  }`}
                >
                  <CreditCardIcon size={15} className="flex-shrink-0" />
                  Cartão
                </button>
              </div>
            </div>

            {paymentMethod === "account" && (
              <ColorSelect
                label="Conta"
                options={accountOptions}
                value={values.accountId}
                onChange={(v) => handleChange("accountId", v)}
                error={fieldErrors.accountId}
              />
            )}

            {paymentMethod === "credit_card" && (
              <div className="flex flex-col gap-3">
                <ColorSelect
                  label="Cartão"
                  options={creditCardOptions}
                  value={creditCardId}
                  onChange={(v) => {
                    setCreditCardId(v);
                    if (fieldErrors.creditCardId) setFieldErrors((prev) => ({ ...prev, creditCardId: undefined }));
                  }}
                  error={fieldErrors.creditCardId}
                />

                {/* toggle: compra parcelada */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isInstallment;
                    setIsInstallment(next);
                    if (!next) {
                      setTotalInstallments("");
                      setFieldErrors((prev) => ({ ...prev, totalInstallments: undefined }));
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
                    isInstallment
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
                  }`}
                >
                  <Layers size={15} className="flex-shrink-0" />
                  <span className="flex-1 text-left">Compra parcelada</span>
                  {isInstallment && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs dark:bg-zinc-900/20">ativo</span>
                  )}
                </button>

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
                    error={fieldErrors.totalInstallments}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* aviso de despesa de cartão em edição */}
        {isEditingCardExpense && (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Esta despesa pertence a um cartão de crédito. O cartão não pode ser alterado na edição.
          </p>
        )}

        {/* conta para receita */}
        {tab === "INCOME" && (
          <ColorSelect
            label="Conta"
            options={accountOptions}
            value={values.accountId}
            onChange={(v) => handleChange("accountId", v)}
            error={fieldErrors.accountId}
          />
        )}

        {/* contas para transferência */}
        {tab === "TRANSFER" && (
          <>
            <ColorSelect
              label="Conta de origem"
              options={accountOptions}
              value={values.accountId}
              onChange={(v) => handleChange("accountId", v)}
              error={fieldErrors.accountId}
            />
            <ColorSelect
              label="Conta de destino"
              options={accountOptions.filter((o) => o.value !== values.accountId)}
              value={values.destinationAccountId}
              onChange={(v) => handleChange("destinationAccountId", v)}
              error={fieldErrors.destinationAccountId}
            />
          </>
        )}

        {/* 3. VALOR */}
        <Input
          label="Valor"
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={values.amountDisplay}
          onChange={(e) => handleAmountChange(e.target.value)}
          error={fieldErrors.amount}
        />

        {/* 4. DATA */}
        <DatePicker
          label="Data"
          value={values.transactionDate}
          onChange={(iso) => handleChange("transactionDate", iso ?? "")}
          error={fieldErrors.transactionDate}
        />

        {/* 5. CATEGORIA */}
        {tab !== "TRANSFER" && (
          <div className="flex flex-col gap-1.5">
            <Select
              label="Categoria"
              options={loadingCats ? [] : categoryOptions}
              value={values.categoryId}
              onChange={(e) => handleChange("categoryId", e.target.value)}
              error={fieldErrors.categoryId}
              disabled={loadingCats || categories.length === 0}
            />
            {!loadingCats && categories.length === 0 && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Nenhuma categoria cadastrada para este tipo.</p>
            )}
          </div>
        )}

        {/* 6. DESCRIÇÃO */}
        <Input
          label="Descrição"
          placeholder="Ex: Supermercado, Salário"
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          error={fieldErrors.description}
        />
      </div>

      {/* ── modal de intervenção: saldo insuficiente ─────────────────────── */}
      {intervention && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => !saving && setIntervention(null)} />
          <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                  <AlertTriangle size={17} className="text-amber-500" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Saldo insuficiente</p>
              </div>
              <button
                type="button"
                onClick={() => setIntervention(null)}
                disabled={saving}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
              >
                <X size={15} />
              </button>
            </div>

            <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
              Sua conta ficará negativa em{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(intervention.shortfall)}
              </span>
              . Como deseja prosseguir?
            </p>

            <div className="flex flex-col gap-3">
              {intervention.vaults.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Resgatar de um cofre</p>
                  <select
                    value={intervention.selectedVaultId}
                    onChange={(e) => setIntervention((prev) => prev ? { ...prev, selectedVaultId: e.target.value } : prev)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:[color-scheme:dark]"
                  >
                    {intervention.vaults.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v.currentBalance)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleVaultRescue}
                    disabled={saving || !intervention.selectedVaultId}
                    className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {saving ? "Processando..." : "Resgatar do Cofre e Pagar"}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleOverdraft}
                disabled={saving}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Continuar mesmo assim (Cheque Especial)
              </button>
            </div>
          </div>
        </>
      )}

      {/* botões — fixos no rodapé */}
      <div className="sticky bottom-0 mt-auto flex gap-3 border-t border-zinc-100 bg-white pt-4 dark:border-zinc-800 dark:bg-zinc-950">
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
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Salvando..." : editing ? "Salvar alterações" : isInstallment ? "Parcelar compra" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
