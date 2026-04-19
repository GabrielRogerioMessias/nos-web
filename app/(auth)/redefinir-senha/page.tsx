"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "@/lib/api";

interface FormState {
  newPassword: string;
  confirmPassword: string;
}

interface FieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [values, setValues] = useState<FormState>({ newPassword: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-red-400">Link inválido.</p>
        <Link
          href="/esqueci-senha"
          className="text-sm text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (apiError) setApiError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    const errors: FieldErrors = {};

    if (!values.newPassword) {
      errors.newPassword = "Senha obrigatória.";
    } else if (values.newPassword.length < 8) {
      errors.newPassword = "A senha deve ter no mínimo 8 caracteres.";
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = "Confirmação obrigatória.";
    } else if (values.newPassword !== values.confirmPassword) {
      errors.confirmPassword = "As senhas não coincidem.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      await api.post("/auth/reset-password", { token, newPassword: values.newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      if (status === 400) {
        setApiError("Link inválido ou expirado.");
      } else if (status === 429) {
        setApiError("Muitas tentativas. Tente novamente em alguns minutos.");
      } else {
        setApiError("Algo deu errado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Senha alterada com sucesso! Redirecionando...
      </p>
    );
  }

  const passwordFieldClass = (hasError: boolean) =>
    `w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 ${
      hasError
        ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Nova Senha */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm text-zinc-600 dark:text-zinc-400">
          Nova Senha
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showNew ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={values.newPassword}
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => handleChange("newPassword", e.target.value)}
            className={passwordFieldClass(!!fieldErrors.newPassword)}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {fieldErrors.newPassword && (
          <p className="text-xs text-red-400">{fieldErrors.newPassword}</p>
        )}
      </div>

      {/* Confirmar Senha */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm text-zinc-600 dark:text-zinc-400">
          Confirmar Senha
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Repita a nova senha"
            value={values.confirmPassword}
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            className={passwordFieldClass(!!fieldErrors.confirmPassword)}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {apiError && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-red-400">{apiError}</p>
          {apiError === "Link inválido ou expirado." && (
            <Link
              href="/esqueci-senha"
              className="text-sm text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
            >
              Solicitar novo link
            </Link>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        onTouchEnd={(e) => e.stopPropagation()}
        className="mt-2 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">NOS</p>
        <h1 className="mb-1 text-xl font-medium text-zinc-900 dark:text-zinc-100">Redefinir senha</h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          Escolha uma nova senha para sua conta.
        </p>

        <Suspense fallback={<p className="text-sm text-zinc-500">Carregando...</p>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/login" className="text-zinc-900 underline underline-offset-2 dark:text-zinc-100">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
