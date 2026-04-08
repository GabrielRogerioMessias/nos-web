"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { createVault, updateVault, type VaultRequest, type VaultResponse } from "@/lib/vaults";
import { getAccounts } from "@/lib/accounts";
import type { AccountResponse } from "@/types/dashboard";

// ─── catálogo ─────────────────────────────────────────────────────────────────

const ICON_NAMES = [
  "PiggyBank", "Vault", "Wallet", "CreditCard", "Banknote", "Coins",
  "TrendingUp", "BarChart2", "Home", "Car", "Plane", "ShoppingCart",
  "Coffee", "Utensils", "Heart", "Star", "Gift", "Umbrella",
  "Zap", "Shield", "Target", "BookOpen", "Briefcase", "Building2",
] as const;

type IconName = typeof ICON_NAMES[number];

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#a3a3a3", // neutral
];

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<LucideProps> | undefined;
  if (!Icon) return <span className="text-[10px] text-zinc-400">{name.slice(0, 2)}</span>;
  return <Icon {...props} />;
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  vault?: VaultResponse;
  onClose: () => void;
  onSuccess: () => void;
}

const VAULT_TYPE_OPTIONS: { value: VaultRequest["vaultType"]; label: string }[] = [
  { value: "GENERAL", label: "Reserva Geral (Livre)" },
  { value: "INVOICE", label: "Reserva para Fatura do Cartão" },
];

export function VaultFormModal({ vault, onClose, onSuccess }: Props) {
  const isEdit = !!vault;

  const [name, setName] = useState(vault?.name ?? "");
  const [color, setColor] = useState(vault?.color ?? COLORS[4]);
  const [icon, setIcon] = useState<string>(vault?.icon ?? "PiggyBank");
  const [vaultType, setVaultType] = useState<VaultRequest["vaultType"]>(vault?.vaultType ?? "GENERAL");
  const [accountId, setAccountId] = useState<string>(vault?.account?.id ?? "");
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string>();
  const [accountError, setAccountError] = useState<string>();

  // Sincroniza campos quando vault muda (modo edição)
  useEffect(() => {
    setName(vault?.name ?? "");
    setColor(vault?.color ?? COLORS[4]);
    setIcon(vault?.icon ?? "PiggyBank");
    setVaultType(vault?.vaultType ?? "GENERAL");
    setAccountId(vault?.account?.id ?? "");
    setNameError(undefined);
    setAccountError(undefined);
  }, [vault?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getAccounts()
      .then((list) => setAccounts(list.filter((a) => a.active)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setNameError("Nome obrigatório."); return; }
    if (!accountId) { setAccountError("Selecione a conta de rendimento."); return; }

    const payload: VaultRequest = {
      name: trimmed,
      vaultType,
      accountId,
      color,
      icon,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await updateVault(vault.id, payload);
      } else {
        await createVault(payload);
      }
      onSuccess();
    } catch {
      // erro tratado no pai
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={!saving ? onClose : undefined} />

      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950" style={{ maxHeight: "90dvh" }}>
        {/* cabeçalho */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {isEdit ? "Editar cofre" : "Novo cofre"}
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
          {/* nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Nome</label>
            <input
              type="text"
              placeholder="Ex: Reserva de emergência"
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

          {/* tipo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Tipo de reserva</label>
            <select
              value={vaultType}
              onChange={(e) => setVaultType(e.target.value as VaultRequest["vaultType"])}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:[color-scheme:dark]"
            >
              {VAULT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* conta de rendimento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Conta de rendimento
            </label>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Onde o dinheiro vai ficar guardado fisicamente.
            </p>
            <select
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); if (accountError) setAccountError(undefined); }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:text-zinc-50 dark:focus:border-zinc-500 dark:[color-scheme:dark] ${
                accountError
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
            {accountError && <p className="text-xs text-red-400">{accountError}</p>}
          </div>

          {/* paleta de cores */}
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

          {/* galeria de ícones */}
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
                    <DynamicIcon
                      name={n}
                      size={16}
                      color={selected ? "#fff" : "#71717a"}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* preview */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: color }}
            >
              <DynamicIcon name={icon} size={16} color="#fff" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {name || "Nome do cofre"}
              </p>
            </div>
          </div>

          {/* botões */}
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
              disabled={saving || !name.trim() || !accountId}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar cofre"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
