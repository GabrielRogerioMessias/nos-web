"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X, AlertTriangle, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import type { VaultResponse } from "@/lib/vaults";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── tipos ────────────────────────────────────────────────────────────────────

type Scenario = "empty" | "exact" | "gain_small" | "gain_large" | "loss";

interface Props {
  vault: VaultResponse;
  onClose: () => void;
  onSuccess: (yieldAmount: number) => void;
  onError: (message: string) => void;
}

// ─── componente ───────────────────────────────────────────────────────────────

export function VaultReconcileModal({ vault, onClose, onSuccess, onError }: Props) {
  const [realBalanceDisplay, setRealBalanceDisplay] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // foca o input ao abrir
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // fecha com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const realBalance = parseCurrency(realBalanceDisplay);
  const hasValue = !isNaN(realBalance);
  const diff = hasValue ? realBalance - vault.currentBalance : NaN;
  const alertThreshold = vault.currentBalance * 0.03;

  function getScenario(): Scenario {
    if (!hasValue || isNaN(diff)) return "empty";
    if (diff === 0) return "exact";
    if (diff > 0 && diff <= alertThreshold) return "gain_small";
    if (diff > alertThreshold) return "gain_large";
    return "loss";
  }

  const scenario = getScenario();
  const canSubmit = scenario === "gain_small" || scenario === "gain_large";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isNaN(diff)) return;
    setSaving(true);
    try {
      await api.post(`/vaults/${vault.id}/yield`, { amount: diff });
      onSuccess(diff);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; error?: string } } };
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao registrar rendimento. Tente novamente.";
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30"
        onClick={!saving ? onClose : undefined}
      />

      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">

        {/* ── cabeçalho ── */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
              <SlidersHorizontal size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Sincronizar Saldo</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{vault.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── pergunta + referência ── */}
        <p className="mb-1 text-sm text-zinc-700 dark:text-zinc-300">
          Qual é o saldo exato que aparece no aplicativo do seu banco agora?
        </p>
        <p className="mb-5 text-xs text-zinc-400 dark:text-zinc-500">
          Saldo atual no app:{" "}
          <span className="font-medium text-zinc-500 dark:text-zinc-400">
            {formatCurrency(vault.currentBalance)}
          </span>
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          {/* ── input de saldo real ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Saldo real (banco)</label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={realBalanceDisplay}
              disabled={saving}
              onChange={(e) => setRealBalanceDisplay(maskCurrency(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500"
            />
          </div>

          {/* ── painel de resultado em tempo real ── */}
          {scenario !== "empty" && (
            <div className="flex flex-col gap-3">

              {/* linha de diferença */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Diferença calculada</p>
                {scenario === "exact" ? (
                  <p className="text-xs font-medium text-emerald-500">± R$ 0,00</p>
                ) : scenario === "loss" ? (
                  <p className="text-xs font-medium text-red-500">
                    − {formatCurrency(Math.abs(diff))}
                  </p>
                ) : (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    + {formatCurrency(diff)}
                  </p>
                )}
              </div>

              {/* cenário 1 — bate perfeitamente */}
              {scenario === "exact" && (
                <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
                  O saldo bate perfeitamente! Nada a sincronizar.
                </p>
              )}

              {/* cenário 3 — diferença grande (warning) */}
              {scenario === "gain_large" && (
                <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-800/60 dark:bg-amber-950/30">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                    <span className="font-medium">Atenção:</span> Essa diferença parece alta para
                    um rendimento mensal. Se você esqueceu de registrar um depósito, feche esta
                    tela e use o botão <span className="font-medium">Guardar</span>.
                  </p>
                </div>
              )}

              {/* cenário 4 — saldo menor (destructive) */}
              {scenario === "loss" && (
                <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 dark:border-red-800/60 dark:bg-red-950/30">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-500" />
                  <p className="text-xs leading-relaxed text-red-700 dark:text-red-400">
                    O saldo do banco está menor. Para registrar taxas, IOF ou saques, feche esta
                    tela e use a opção <span className="font-medium">Resgatar</span>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── botões ── */}
          <div className="mt-1 flex gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
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
              disabled={!canSubmit || saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? (
                "Registrando..."
              ) : (
                <>
                  <TrendingUp size={14} />
                  Registrar como Rendimento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
