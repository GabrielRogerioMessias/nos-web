"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  getCreditCards,
  getCreditCard,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getInvoice,
  getCurrentInvoice,
} from "@/lib/credit-cards";
import { getAccounts } from "@/lib/accounts";
import type { CreditCardResponse, CreditCardRequest, InvoiceResponse } from "@/types/dashboard";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import {
  CreditCardList,
  CreditCardListSkeleton,
  type CardWithInvoice,
} from "@/components/credit-cards/CreditCardList";
import { CreditCardForm } from "@/components/credit-cards/CreditCardForm";
import { NoAccountModal } from "@/components/accounts/NoAccountModal";
import { ContextualHelpDrawer } from "@/components/help/ContextualHelpDrawer";

let toastId = 0;

function currentMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonthISO(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function CartoesPage() {
  const [cards, setCards] = useState<CreditCardResponse[] | null>(null);
  const [invoices, setInvoices] = useState<Record<string, InvoiceResponse | null>>({});
  const [invoiceLoading, setInvoiceLoading] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCardResponse | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);
  const [showNoAccountsWarning, setShowNoAccountsWarning] = useState(false);
  // ref para cancelar fetches obsoletos ao desmontar
  const abortRef = useRef<AbortController | null>(null);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // busca a fatura em aberto de cada cartão (backend decide qual é a atual)
  const loadInvoices = useCallback(async (list: CreditCardResponse[]) => {
    setInvoiceLoading(Object.fromEntries(list.map((c) => [c.id, true])));

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    await Promise.allSettled(
      list.map(async (card) => {
        try {
          const data = await getCurrentInvoice(card.id);
          if (ctrl.signal.aborted) return;
          setInvoices((prev) => ({ ...prev, [card.id]: data }));
        } catch {
          if (ctrl.signal.aborted) return;
          setInvoices((prev) => ({ ...prev, [card.id]: null }));
        } finally {
          if (!ctrl.signal.aborted) {
            setInvoiceLoading((prev) => ({ ...prev, [card.id]: false }));
          }
        }
      })
    );
  }, []);

  const loadCards = useCallback(async () => {
    try {
      const data = await getCreditCards();
      setCards(data);
      loadInvoices(data);
    } catch {
      addToast("Não foi possível carregar os cartões.", "error");
      setCards([]);
    }
  }, [loadInvoices]);

  useEffect(() => {
    loadCards();
    getAccounts()
      .then((list) => setHasAccounts(list.some((a) => a.active)))
      .catch(() => setHasAccounts(false));
    return () => { abortRef.current?.abort(); };
  }, [loadCards]);

  function openNew() {
    if (hasAccounts === false) {
      setShowNoAccountsWarning(true);
      return;
    }
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(card: CreditCardResponse) { setEditing(card); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  async function handleSave(payload: CreditCardRequest) {
    try {
      if (editing) {
        const updated = await updateCreditCard(editing.id, payload);
        setCards((prev) => prev ? prev.map((c) => c.id === updated.id ? updated : c) : prev);
        addToast("Cartão atualizado com sucesso.");
      } else {
        const created = await createCreditCard(payload);
        setCards((prev) => prev ? [...prev, created] : [created]);
        // busca fatura do novo cartão
        const month = currentMonthISO();
        setInvoiceLoading((prev) => ({ ...prev, [created.id]: true }));
        getInvoice(created.id, month)
          .then((inv) => setInvoices((prev) => ({ ...prev, [created.id]: inv })))
          .catch(() => setInvoices((prev) => ({ ...prev, [created.id]: null })))
          .finally(() => setInvoiceLoading((prev) => ({ ...prev, [created.id]: false })));
        addToast("Cartão criado com sucesso.");
      }
      closeModal();
    } catch {
      addToast("Erro ao salvar o cartão. Tente novamente.", "error");
      throw new Error("api_error");
    }
  }

  // após pagar a fatura de um cartão específico:
  // 1. rebusca o cartão para atualizar o limite disponível
  // 2. rebusca a fatura do mês atual (virá com paid=true) — o card decide como renderizar
  async function handlePaymentSuccess(cardId: string) {
    addToast("Fatura paga com sucesso!");

    // rebusca cartão em paralelo para atualizar limite livre imediatamente
    getCreditCard(cardId)
      .then((updated) => setCards((prev) => prev ? prev.map((c) => c.id === updated.id ? updated : c) : prev))
      .catch(() => {/* silencia */});

    const currentMonth = currentMonthISO();
    setInvoiceLoading((prev) => ({ ...prev, [cardId]: true }));
    try {
      const inv = await getInvoice(cardId, currentMonth);
      setInvoices((prev) => ({ ...prev, [cardId]: inv }));
    } catch {
      // mantém a fatura anterior em caso de falha
    } finally {
      setInvoiceLoading((prev) => ({ ...prev, [cardId]: false }));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCreditCard(id);
      setCards((prev) => prev ? prev.filter((c) => c.id !== id) : prev);
      setInvoices((prev) => { const next = { ...prev }; delete next[id]; return next; });
      addToast("Cartão excluído.");
    } catch {
      addToast("Erro ao excluir o cartão.", "error");
    }
  }

  // monta os items com os dados de fatura
  const items: CardWithInvoice[] = (cards ?? []).map((card) => ({
    card,
    invoice: invoices[card.id] ?? null,
    invoiceLoading: invoiceLoading[card.id] ?? false,
  }));

  const count = cards?.length ?? 0;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50">Cartões</h1>
              <ContextualHelpDrawer />
            </div>
            {cards !== null && (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {count === 0
                  ? "Nenhum cartão cadastrado"
                  : `${count} ${count === 1 ? "cartão cadastrado" : "cartões cadastrados"}`}
              </p>
            )}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={15} />
            Novo cartão
          </button>
        </div>

        {cards === null ? (
          <CreditCardListSkeleton />
        ) : (
          <CreditCardList
            items={items}
            onEdit={openEdit}
            onDelete={handleDelete}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={(msg) => addToast(msg, "error")}
            onAddNew={openNew}
          />
        )}
      </div>

      {modalOpen && (
        <CreditCardForm editing={editing} onSave={handleSave} onCancel={closeModal} />
      )}

      {/* aviso: nenhuma conta cadastrada */}
      {showNoAccountsWarning && (
        <NoAccountModal
          context="um cartão de crédito"
          onClose={() => setShowNoAccountsWarning(false)}
          onAccountCreated={() => setHasAccounts(true)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
