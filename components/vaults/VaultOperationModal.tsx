"use client";

import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import { depositToVault, withdrawFromVault, type VaultResponse } from "@/lib/vaults";
import { getAccounts } from "@/lib/accounts";
import type { AccountResponse } from "@/types/dashboard";
import { Select } from "@/components/ui/Select";

type OperationType = "deposit" | "withdraw";

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

interface Props {
  vault: VaultResponse;
  type: OperationType;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function VaultOperationModal({ vault, type, onClose, onSuccess, onError }: Props) {
  const [amountDisplay, setAmountDisplay] = useState("");
  const [accountId, setAccountId] = useState(vault.account?.id ?? "");
  const [description, setDescription] = useState("");
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; accountId?: string }>({});

  const isDeposit = type === "deposit";
  const containerLabel = vault.vaultType === "GOAL" ? "meta" : "cofre";

  useEffect(() => {
    // No resgate, a conta já é fixa (conta pai do cofre) — só precisa carregar para o depósito
    if (!isDeposit) return;
    getAccounts().then((list) => {
      const active = list.filter((a) => a.active);
      setAccounts(active);
      // Pré-seleciona a conta pai do cofre se disponível, senão a primeira
      const defaultId = vault.account?.id ?? (active[0]?.id ?? "");
      setAccountId(defaultId);
    });
  }, [isDeposit, vault.account?.id]);

  // fecha com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseCurrency(amountDisplay);
    const next: typeof errors = {};
    if (!amountDisplay || isNaN(amount) || amount <= 0)
      next.amount = "Informe um valor maior que zero.";
    if (!accountId) next.accountId = "Selecione uma conta.";
    if (Object.keys(next).length) { setErrors(next); return; }

    setSaving(true);
    try {
      if (isDeposit) {
        await depositToVault(vault.id, amount, accountId, description || undefined);
      } else {
        await withdrawFromVault(vault.id, amount, accountId, description || undefined);
      }
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string; error?: string } } };
      const backendMessage =
        axiosError.response?.data?.message || axiosError.response?.data?.error || "";
      const msg = backendMessage.toLowerCase();
      const isBalanceError =
        msg.includes("balance") ||
        msg.includes("insufficient") ||
        msg.includes("saldo") ||
        msg.includes("funds");

      if (isBalanceError) {
        const container = vault.vaultType === "GOAL" ? "meta" : "cofre";
        onError(
          isDeposit
            ? "Saldo da conta bancária insuficiente para essa transação."
            : `Saldo da ${container} insuficiente para realizar o resgate.`
        );
      } else {
        onError(backendMessage || "Erro ao processar a operação. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />

      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* cabeçalho */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isDeposit ? "bg-emerald-50 dark:bg-emerald-950/50" : "bg-red-50 dark:bg-red-950/50"}`}>
              {isDeposit
                ? <ArrowDownCircle size={18} className="text-emerald-500" />
                : <ArrowUpCircle size={18} className="text-red-500" />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {isDeposit ? `Guardar na ${containerLabel}` : `Resgatar da ${containerLabel}`}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{vault.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* saldo atual */}
        <div className="mb-5 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Saldo atual da {containerLabel}</p>
          <p className="mt-0.5 text-base font-medium text-zinc-900 dark:text-zinc-50">
            {formatCurrency(vault.currentBalance)}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* valor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Valor</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={amountDisplay}
              onChange={(e) => {
                setAmountDisplay(maskCurrency(e.target.value));
                if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
              }}
              autoFocus
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 ${
                errors.amount
                  ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            />
            {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
          </div>

          {/* conta */}
          {isDeposit ? (
            <div className="flex flex-col gap-1.5">
              <Select
                label="Conta de débito"
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  if (errors.accountId) setErrors((p) => ({ ...p, accountId: undefined }));
                }}
                options={
                  accounts.length === 0
                    ? [{ value: "", label: "Nenhuma conta ativa" }]
                    : accounts.map((acc) => ({ value: acc.id, label: acc.name }))
                }
                error={errors.accountId}
              />
              {selectedAccount && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Saldo disponível</p>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(Number(selectedAccount.currentBalance ?? 0))}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Resgate: conta destino é sempre a conta pai — apenas informativo */
            vault.account && (
              <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Destino do resgate</p>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {vault.account.bankName
                    ? `${vault.account.bankName} — ${vault.account.name}`
                    : vault.account.name}
                </p>
              </div>
            )
          )}

          {/* descrição opcional */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Descrição <span className="text-zinc-400 dark:text-zinc-500">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder={isDeposit ? "Ex: Reserva de emergência" : "Ex: Uso das férias"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
          </div>

          {/* botões */}
          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving
                ? isDeposit ? "Guardando..." : "Resgatando..."
                : isDeposit ? "Guardar" : "Resgatar"
              }
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
