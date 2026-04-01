"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import { Input } from "@/components/ui/Input";
import { login, saveTokens } from "@/lib/auth";

interface FormState {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(values: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.email) {
    errors.email = "E-mail obrigatório.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Formato de e-mail inválido.";
  }
  if (!values.password) {
    errors.password = "Senha obrigatória.";
  } else if (values.password.length < 8) {
    errors.password = "A senha deve ter no mínimo 8 caracteres.";
  }
  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormState>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (apiError) setApiError(null);
  }

  function handleBlur(field: keyof FormState) {
    const errors = validate(values);
    if (errors[field]) setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(values);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    setApiError(null);
    try {
      const auth = await login(values.email, values.password);
      saveTokens(auth);
      router.replace("/");
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      setApiError(
        status === 401 || status === 403
          ? "E-mail ou senha incorretos."
          : "Algo deu errado. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = !values.email || !values.password || loading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-2xl font-light tracking-tight text-zinc-900">NOS</p>
        <h1 className="mb-1 text-xl font-medium text-zinc-900">Entrar</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Sem conta?{" "}
          <Link href="/cadastro" className="text-zinc-900 underline underline-offset-2">
            Criar agora
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={fieldErrors.email}
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            error={fieldErrors.password}
            autoComplete="current-password"
          />
          {apiError && <p className="text-sm text-red-400">{apiError}</p>}
          <button
            type="submit"
            disabled={isDisabled}
            className="mt-2 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
