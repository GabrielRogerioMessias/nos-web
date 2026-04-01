"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getCreditCards, createCreditCard, updateCreditCard, deleteCreditCard } from "@/lib/credit-cards";
import type { CreditCardResponse, CreditCardRequest } from "@/types/dashboard";
import { SlideOver } from "@/components/ui/SlideOver";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { CreditCardList, CreditCardListSkeleton } from "@/components/credit-cards/CreditCardList";
import { CreditCardForm } from "@/components/credit-cards/CreditCardForm";

let toastId = 0;

export default function CartoesPage() {
  const [cards, setCards] = useState<CreditCardResponse[] | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCardResponse | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const loadCards = useCallback(async () => {
    try {
      const data = await getCreditCards();
      setCards(data);
    } catch {
      addToast("Não foi possível carregar os cartões.", "error");
      setCards([]);
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  function openNew() { setEditing(null); setSlideOpen(true); }
  function openEdit(card: CreditCardResponse) { setEditing(card); setSlideOpen(true); }
  function closeSlide() { setSlideOpen(false); setEditing(null); }

  async function handleSave(payload: CreditCardRequest) {
    try {
      if (editing) {
        const updated = await updateCreditCard(editing.id, payload);
        setCards((prev) => prev ? prev.map((c) => c.id === updated.id ? updated : c) : prev);
        addToast("Cartão atualizado com sucesso.");
      } else {
        const created = await createCreditCard(payload);
        setCards((prev) => prev ? [...prev, created] : [created]);
        addToast("Cartão criado com sucesso.");
      }
      closeSlide();
    } catch {
      addToast("Erro ao salvar o cartão. Tente novamente.", "error");
      throw new Error("api_error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCreditCard(id);
      setCards((prev) => prev ? prev.filter((c) => c.id !== id) : prev);
      addToast("Cartão excluído.");
    } catch {
      addToast("Erro ao excluir o cartão.", "error");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-zinc-900">Cartões</h1>
            {cards !== null && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {cards.length === 0
                  ? "Nenhum cartão cadastrado"
                  : `${cards.length} cartão${cards.length !== 1 ? "ões" : ""} cadastrado${cards.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Plus size={15} />
            Novo cartão
          </button>
        </div>

        {cards === null ? (
          <CreditCardListSkeleton />
        ) : (
          <CreditCardList cards={cards} onEdit={openEdit} onDelete={handleDelete} />
        )}
      </div>

      <SlideOver open={slideOpen} onClose={closeSlide} title={editing ? "Editar cartão" : "Novo cartão"}>
        <CreditCardForm editing={editing} onSave={handleSave} onCancel={closeSlide} />
      </SlideOver>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
