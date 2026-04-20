"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { Modal } from "@/components/ui/Modal";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { createAccount } from "@/lib/accounts";
import { createCreditCard } from "@/lib/credit-cards";
import { createVault } from "@/lib/vaults";

// ─── tipos ────────────────────────────────────────────────────────────────────

interface Props {
  initialStep: 1 | 2 | 3;
  prefilledAccountId?: string;
  prefilledCardName?: string;
  onComplete: () => void;
}

interface FieldErrors {
  [key: string]: string | undefined;
}

let toastIdCounter = 0;
function nextId() { return ++toastIdCounter; }

// ─── helpers ──────────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 < current
              ? "w-6 bg-zinc-400 dark:bg-zinc-500"
              : i + 1 === current
              ? "w-6 bg-zinc-900 dark:bg-zinc-100"
              : "w-6 bg-zinc-200 dark:bg-zinc-700"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500">
        {current} de {total}
      </span>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500";

const inputErrorClass =
  "w-full rounded-lg border border-red-300 bg-red-50/40 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 dark:border-red-800 dark:bg-red-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600";

// ─── Passo 1 — Conta ─────────────────────────────────────────────────────────

function Step1({
  onNext,
  addToast,
}: {
  onNext: (accountId: string) => void;
  addToast: (msg: string, type?: ToastData["type"]) => void;
}) {
  const [bankName, setBankName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: FieldErrors = {};
    if (!bankName.trim()) e.bankName = "Nome do banco obrigatório.";
    else if (bankName.trim().length > 100) e.bankName = "Máximo de 100 caracteres.";
    return e;
  }

  async function handleContinue() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const account = await createAccount({
        name: bankName.trim(),
        type: "CHECKING",
        initialBalance: 0,
      });
      onNext(account.id);
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao criar conta. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          Qual é o seu banco principal?
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Vamos começar pelo banco onde você mais movimenta dinheiro.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Nome do banco</label>
        <input
          type="text"
          placeholder="Ex: Nubank, Itaú, Inter..."
          value={bankName}
          maxLength={100}
          onChange={(e) => {
            setBankName(e.target.value);
            if (errors.bankName) setErrors({});
          }}
          className={errors.bankName ? inputErrorClass : inputClass}
        />
        {errors.bankName && <p className="text-xs text-red-400">{errors.bankName}</p>}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Criando..." : "Continuar"}
      </button>
    </div>
  );
}

// ─── Passo 2 — Cartão ─────────────────────────────────────────────────────────

function Step2({
  onNext,
  addToast,
}: {
  onNext: (cardId: string, cardName: string) => void;
  addToast: (msg: string, type?: ToastData["type"]) => void;
}) {
  const [cardName, setCardName] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: FieldErrors = {};
    const closing = parseInt(closingDay, 10);
    const due = parseInt(dueDay, 10);

    if (!cardName.trim()) e.cardName = "Nome do cartão obrigatório.";
    else if (cardName.trim().length > 100) e.cardName = "Máximo de 100 caracteres.";

    if (!closingDay) e.closingDay = "Dia de fechamento obrigatório.";
    else if (!Number.isInteger(closing) || closing < 1 || closing > 31)
      e.closingDay = "Informe um dia entre 1 e 31.";

    if (!dueDay) e.dueDay = "Dia de vencimento obrigatório.";
    else if (!Number.isInteger(due) || due < 1 || due > 31)
      e.dueDay = "Informe um dia entre 1 e 31.";
    else if (Number.isInteger(closing) && due <= closing)
      e.dueDay = "O vencimento deve ser depois do fechamento.";

    return e;
  }

  async function handleContinue() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const card = await createCreditCard({
        name: cardName.trim(),
        closingDay: parseInt(closingDay, 10),
        dueDay: parseInt(dueDay, 10),
      });
      onNext(card.id, card.name);
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao criar cartão. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          Adicione seu cartão de crédito
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Assim você acompanha suas faturas e nunca é pego de surpresa.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Nome do cartão</label>
          <input
            type="text"
            placeholder="Ex: Nubank Gold, Itaú Visa..."
            value={cardName}
            maxLength={100}
            onChange={(e) => { setCardName(e.target.value); clearError("cardName"); }}
            className={errors.cardName ? inputErrorClass : inputClass}
          />
          {errors.cardName && <p className="text-xs text-red-400">{errors.cardName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Fechamento</label>
            <input
              type="number"
              placeholder="Ex: 20"
              value={closingDay}
              min={1}
              max={31}
              onChange={(e) => { setClosingDay(e.target.value); clearError("closingDay"); clearError("dueDay"); }}
              className={errors.closingDay ? inputErrorClass : inputClass}
            />
            {errors.closingDay && <p className="text-xs text-red-400">{errors.closingDay}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Vencimento</label>
            <input
              type="number"
              placeholder="Ex: 28"
              value={dueDay}
              min={1}
              max={31}
              onChange={(e) => { setDueDay(e.target.value); clearError("dueDay"); }}
              className={errors.dueDay ? inputErrorClass : inputClass}
            />
            {errors.dueDay && <p className="text-xs text-red-400">{errors.dueDay}</p>}
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Criando..." : "Continuar"}
      </button>
    </div>
  );
}

// ─── Passo 3 — Cofre de Fatura ────────────────────────────────────────────────

function Step3({
  accountId,
  cardName,
  onComplete,
  addToast,
}: {
  accountId: string;
  cardName: string;
  onComplete: () => void;
  addToast: (msg: string, type?: ToastData["type"]) => void;
}) {
  const [subState, setSubState] = useState<"loading" | "success" | "error">("loading");

  async function createInvoiceVault() {
    setSubState("loading");
    const [result] = await Promise.allSettled([
      createVault({ name: `Fatura ${cardName}`, vaultType: "INVOICE", accountId }),
      new Promise((r) => setTimeout(r, 1500)),
    ]);

    if (result.status === "fulfilled") {
      setSubState("success");
    } else {
      const msg = (result.reason as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao criar cofre. Tente novamente.", "error");
      setSubState("error");
    }
  }

  useEffect(() => {
    createInvoiceVault();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (subState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Loader2 size={32} className="animate-spin text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Preparando seu Cofre de Fatura...
        </p>
      </div>
    );
  }

  if (subState === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-red-400">Não foi possível criar o Cofre de Fatura.</p>
        <button
          onClick={createInvoiceVault}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 size={40} className="text-emerald-500" />
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          Seu Cofre de Fatura está pronto!
        </h2>
        <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
          Cada vez que você gastar no cartão, guarde o mesmo valor aqui.
          <br />
          No fim do mês, o cofre paga a fatura — e o rendimento fica pra você.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onComplete}
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Começar agora →
        </button>
        <button
          onClick={onComplete}
          className="w-full rounded-lg py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Entender depois
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function OnboardingFlow({ initialStep, prefilledAccountId, prefilledCardName, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [accountId, setAccountId] = useState(prefilledAccountId ?? "");
  const [cardName, setCardName] = useState(prefilledCardName ?? "");
  const [toasts, setToasts] = useState<ToastData[]>([]);

  function addToast(message: string, type: ToastData["type"] = "success") {
    setToasts((prev) => [...prev, { id: nextId(), message, type }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleComplete() {
    window.dispatchEvent(new CustomEvent("transaction-updated"));
    onComplete();
  }

  return (
    <>
      <Modal onClose={() => {}} disableOverlayClose>
        <div className="flex flex-col gap-6">
          <StepIndicator current={step} total={3} />

          {step === 1 && (
            <Step1
              onNext={(id) => { setAccountId(id); setStep(2); }}
              addToast={addToast}
            />
          )}

          {step === 2 && (
            <Step2
              onNext={(_, name) => { setCardName(name); setStep(3); }}
              addToast={addToast}
            />
          )}

          {step === 3 && (
            <Step3
              accountId={accountId}
              cardName={cardName}
              onComplete={handleComplete}
              addToast={addToast}
            />
          )}
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
