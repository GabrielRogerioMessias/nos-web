"use client";

import { useEffect, useState } from "react";
import { CreditCard, Landmark, PiggyBank } from "lucide-react";
import { payInvoice } from "@/lib/credit-cards";
import { getAccounts } from "@/lib/accounts";
import { getVaults } from "@/lib/vaults";
import type { CreditCardResponse, InvoiceResponse } from "@/types/dashboard";
import type { AccountResponse } from "@/types/dashboard";
import type { VaultResponse } from "@/lib/vaults";
import { Modal } from "@/components/ui/Modal";

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type SourceType = "account" | "vault";

interface Props {
  card: CreditCardResponse;
  invoice: InvoiceResponse;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function InvoicePaymentModal({ card, invoice, onClose, onSuccess, onError }: Props) {
  const [amountDisplay, setAmountDisplay] = useState(() =>
    maskCurrency(String(Math.round(invoice.totalAmount * 100)))
  );
  const [sourceType, setSourceType] = useState<SourceType>("account");
  const [sourceId, setSourceId] = useState("");
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [vaults, setVaults] = useState<VaultResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; source?: string }>({});

  useEffect(() => {
    Promise.all([
      getAccounts().catch(() => [] as AccountResponse[]),
      getVaults().catch(() => [] as VaultResponse[]),
    ]).then(([accs, vts]) => {
      const activeAccounts = accs.filter((a) => a.active);
      const invoiceVaults = vts.filter((v) => v.vaultType === "INVOICE" && v.active);
      setAccounts(activeAccounts);
      setVaults(invoiceVaults);

      const vaultWithBalance = invoiceVaults.find((v) => v.currentBalance > 0);
      if (vaultWithBalance) {
        setSourceType("vault");
        setSourceId(vaultWithBalance.id);
      } else {
        const bestAccount = activeAccounts.reduce<AccountResponse | null>(
          (best, a) => (!best || (a.currentBalance ?? 0) > (best.currentBalance ?? 0) ? a : best),
          null
        );
        if (bestAccount) setSourceId(bestAccount.id);
      }
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseCurrency(amountDisplay);
    const next: typeof errors = {};
    if (!amountDisplay || isNaN(amount) || amount <= 0)
      next.amount = "Informe um valor maior que zero.";
    if (!sourceId)
      next.source = `Selecione ${sourceType === "account" ? "uma conta" : "um cofre"}.`;
    if (Object.keys(next).length) { setErrors(next); return; }

    setSaving(true);
    try {
      await payInvoice(card.id, {
        month: invoice.month,
        amount,
        paymentDate: todayISO(),
        ...(sourceType === "account"
          ? { accountId: sourceId || undefined }
          : { vaultId: sourceId || undefined }),
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; error?: string } } };
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao processar o pagamento. Tente novamente.";
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  const selectedAccount = accounts.find((a) => a.id === sourceId);
  const selectedVault = vaults.find((v) => v.id === sourceId);

  const title = (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <CreditCard size={18} className="text-zinc-600 dark:text-zinc-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Pagar fatura</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{card.name}</p>
      </div>
    </div>
  );

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Cancelar
      </button>
      <button
        form="invoice-payment-form"
        type="submit"
        disabled={saving || loading}
        className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "Pagando..." : "Confirmar pagamento"}
      </button>
    </div>
  );

  return (
    <Modal title={title} onClose={onClose} disableOverlayClose={saving} footer={footer}>
      {/* resumo da fatura */}
      <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Total da fatura fechada</p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {formatCurrency(invoice.totalAmount)}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Vencimento: {new Date(invoice.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
        </p>
      </div>

      <form id="invoice-payment-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* valor a pagar */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Valor a pagar</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={amountDisplay}
            onChange={(e) => {
              setAmountDisplay(maskCurrency(e.target.value));
              setErrors((p) => ({ ...p, amount: undefined }));
            }}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 ${
              errors.amount
                ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                : "border-zinc-200 bg-white dark:border-zinc-700"
            }`}
          />
          {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
        </div>

        {/* escolha da fonte */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Pagar com</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSourceType("account");
                setSourceId(accounts[0]?.id ?? "");
                setErrors((p) => ({ ...p, source: undefined }));
              }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                sourceType === "account"
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <Landmark size={15} /> Conta bancária
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceType("vault");
                setSourceId(vaults[0]?.id ?? "");
                setErrors((p) => ({ ...p, source: undefined }));
              }}
              disabled={vaults.length === 0}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                sourceType === "vault"
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <PiggyBank size={15} /> Cofre de fatura
            </button>
          </div>
        </div>

        {/* select de conta ou cofre */}
        {loading ? (
          <div className="h-11 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        ) : (
          <div className="flex flex-col gap-1.5">
            <select
              value={sourceId}
              onChange={(e) => { setSourceId(e.target.value); setErrors((p) => ({ ...p, source: undefined })); }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 ${
                errors.source
                  ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-700"
              }`}
            >
              {sourceType === "account"
                ? accounts.length === 0
                  ? <option value="">Nenhuma conta ativa</option>
                  : accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)
                : vaults.length === 0
                  ? <option value="">Nenhum cofre de fatura</option>
                  : vaults.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)
              }
            </select>
            {errors.source && <p className="text-xs text-red-400">{errors.source}</p>}

            {sourceType === "account" && selectedAccount && (
              <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Saldo disponível</p>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {formatCurrency(Number(selectedAccount.currentBalance ?? 0))}
                </p>
              </div>
            )}
            {sourceType === "vault" && selectedVault && (
              <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Saldo do cofre</p>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {formatCurrency(Number(selectedVault.currentBalance ?? 0))}
                </p>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
