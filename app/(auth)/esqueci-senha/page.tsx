"use client";

import { useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";

interface FormState {
  email: string;
}

interface FieldErrors {
  email?: string;
}

export default function ForgotPasswordPage() {
  const [values, setValues] = useState<FormState>({ email: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (apiError) setApiError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    const trimmedEmail = values.email.trim();
    const errors: FieldErrors = {};

    if (!trimmedEmail) {
      errors.email = "E-mail obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Formato de e-mail inválido.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      await api.post("/auth/forgot-password", { email: trimmedEmail });
      setSent(true);
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      setApiError(
        status === 429
          ? "Muitas tentativas. Tente novamente em alguns minutos."
          : "Algo deu errado. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">NOS</p>
        <h1 className="mb-1 text-xl font-medium text-zinc-900 dark:text-zinc-100">Recuperar senha</h1>

        {sent ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Se este e-mail estiver cadastrado, enviamos instruções de recuperação. Verifique sua caixa de entrada.
          </p>
        ) : (
          <>
            <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
              Informe seu e-mail e enviaremos as instruções de recuperação.
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                label="E-mail"
                type="email"
                placeholder="voce@email.com"
                value={values.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={fieldErrors.email}
                autoComplete="email"
                inputMode="email"
              />

              {apiError && <p className="text-sm text-red-400">{apiError}</p>}

              <button
                type="submit"
                disabled={loading}
                onTouchEnd={(e) => e.stopPropagation()}
                className="mt-2 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? "Enviando..." : "Enviar instruções"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/login" className="text-zinc-900 underline underline-offset-2 dark:text-zinc-100">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
