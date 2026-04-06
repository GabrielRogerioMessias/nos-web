"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getCreditCards, getInvoice, payInvoice } from "@/lib/credit-cards";
import { getAccounts } from "@/lib/accounts";
import { getVaults, type VaultResponse } from "@/lib/vaults";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import type { CreditCardResponse, InvoiceResponse, AccountResponse } from "@/types/dashboard";

let toastId = 0;

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function currentMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function prevMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ─── skeletons ────────────────────────────────────────────────────────────────

function InvoiceSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-3 h-10 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-4 h-3 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="h-3.5 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── modal de pagamento ───────────────────────────────────────────────────────

interface PayInvoiceModalProps {
  cardId: string;
  month: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
  onError: () => void;
}

function PayInvoiceModal({ cardId, month, amount, onClose, onSuccess, onError }: PayInvoiceModalProps) {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [invoiceVaults, setInvoiceVaults] = useState<VaultResponse[]>([]);
  const [selectedValue, setSelectedValue] = useState("");
  const [loading, setLoading] = useState(false);
  const paymentDate = todayISO();

  useEffect(() => {
    Promise.all([getAccounts(), getVaults()])
      .then(([accs, vaults]) => {
        const activeAccounts = accs.filter((a) => a.active);
        const filteredVaults = vaults.filter((v) => v.active && v.vaultType === "INVOICE");
        setAccounts(activeAccounts);
        setInvoiceVaults(filteredVaults);
        if (activeAccounts.length > 0) {
          setSelectedValue("account:" + activeAccounts[0].id);
        } else if (filteredVaults.length > 0) {
          setSelectedValue("vault:" + filteredVaults[0].id);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedValue) return;
    setLoading(true);

    const [prefix, id] = selectedValue.split(":");
    const payload =
      prefix === "vault"
        ? { vaultId: id, month, amount, paymentDate }
        : { accountId: id, month, amount, paymentDate };

    try {
      await payInvoice(cardId, payload);
      window.dispatchEvent(new CustomEvent("transaction-updated"));
      onSuccess();
    } catch {
      onError();
    } finally {
      setLoading(false);
    }
  }

  const hasOptions = accounts.length > 0 || invoiceVaults.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={!loading ? onClose : undefined} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Pagar fatura</p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Escolha a conta ou cofre para debitar o pagamento.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Débitar de</label>
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              disabled={loading || !hasOptions}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:[color-scheme:dark]"
            >
              {!hasOptions && <option value="">Carregando...</option>}
              {accounts.length > 0 && (
                <optgroup label="Contas Bancárias">
                  {accounts.map((a) => (
                    <option key={a.id} value={"account:" + a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {invoiceVaults.length > 0 && (
                <optgroup label="Cofres de Fatura">
                  {invoiceVaults.map((v) => (
                    <option key={v.id} value={"vault:" + v.id}>
                      {v.name} — {formatCurrency(v.currentBalance)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Valor a pagar</label>
            <p className="text-lg font-light text-zinc-900 dark:text-zinc-100">{formatCurrency(amount)}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Data do pagamento</label>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{formatDate(paymentDate)}</p>
          </div>

          <div className="mt-1 flex gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedValue}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Pagando..." : "Confirmar pagamento"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── página ───────────────────────────────────────────────────────────────────

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [card, setCard] = useState<CreditCardResponse | null>(null);
  const [month, setMonth] = useState(currentMonthISO());
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const tid = ++toastId;
    setToasts((prev) => [...prev, { id: tid, message, type }]);
  }

  // carrega dados do cartão
  useEffect(() => {
    getCreditCards()
      .then((cards) => setCard(cards.find((c) => c.id === id) ?? null))
      .catch(() => {});
  }, [id]);

  const loadInvoice = useCallback(async (m: string) => {
    setInvoiceLoading(true);
    setInvoiceError(false);
    setInvoice(null);
    try {
      const data = await getInvoice(id, m);
      setInvoice(data);
    } catch {
      setInvoiceError(true);
    } finally {
      setInvoiceLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvoice(month);
  }, [month, loadInvoice]);

  function handlePrev() { setMonth((m) => prevMonth(m)); }
  function handleNext() { setMonth((m) => nextMonth(m)); }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* cabeçalho */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/cartoes")}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            {card ? (
              <>
                <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">{card.name}</h1>
                {card.brand && <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">{card.brand}</p>}
              </>
            ) : (
              <>
                <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-1 h-3.5 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </>
            )}
          </div>
        </div>

        {/* navegador de meses */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            onClick={handlePrev}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300">{monthLabel(month)}</span>
          <button
            onClick={handleNext}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* conteúdo da fatura */}
        {invoiceLoading ? (
          <InvoiceSkeleton />
        ) : invoiceError ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Não foi possível carregar a fatura.</p>
          </div>
        ) : invoice ? (
          <>
            {/* resumo */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total da fatura</p>
              <p className="mt-2 text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">
                {formatCurrency(invoice.totalAmount)}
              </p>
              <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                Fecha {formatDate(invoice.closingDate)} · Vence {formatDate(invoice.dueDate)}
              </p>

              {invoice.totalAmount > 0 && (
                <button
                  onClick={() => setPayModalOpen(true)}
                  className="mt-5 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Pagar fatura
                </button>
              )}
            </div>

            {/* lista de compras */}
            {invoice.transactions.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Nenhuma compra nesta fatura.</p>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">Compras</p>
                <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
                  {invoice.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">{tx.description}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {tx.category?.name ?? "—"} · {formatDate(tx.transactionDate)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                        – {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {payModalOpen && invoice && (
        <PayInvoiceModal
          cardId={id}
          month={month}
          amount={invoice.totalAmount}
          onClose={() => setPayModalOpen(false)}
          onSuccess={() => {
            setPayModalOpen(false);
            addToast("Fatura paga com sucesso.");
            loadInvoice(month);
          }}
          onError={() => {
            setPayModalOpen(false);
            addToast("Erro ao pagar a fatura. Tente novamente.", "error");
          }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={(tid) => setToasts((prev) => prev.filter((t) => t.id !== tid))} />
    </>
  );
}
