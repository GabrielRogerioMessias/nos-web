"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { AxiosError } from "axios";
import { Input } from "@/components/ui/Input";
import { register, saveTokens } from "@/lib/auth";

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function CadastroPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormState>({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (apiError) setApiError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    const trimmedName = values.name.trim();
    const trimmedEmail = values.email.trim();
    const errors: FieldErrors = {};

    if (!trimmedName) errors.name = "Nome obrigatório.";
    if (!trimmedEmail) {
      errors.email = "E-mail obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Formato de e-mail inválido.";
    }
    if (!values.password) {
      errors.password = "Senha obrigatória.";
    } else if (values.password.length < 8) {
      errors.password = "A senha deve ter no mínimo 8 caracteres.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const auth = await register(trimmedName, trimmedEmail, values.password);
      saveTokens(auth);
      router.replace("/");
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      setApiError(
        status === 409
          ? "Este e-mail já está em uso."
          : "Algo deu errado. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-2xl font-light tracking-tight text-zinc-900">NOS</p>
        <h1 className="mb-1 text-xl font-medium text-zinc-900">Criar conta</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Já tem conta?{" "}
          <Link href="/login" className="text-zinc-900 underline underline-offset-2">
            Entrar
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Nome"
            type="text"
            placeholder="Seu nome"
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={fieldErrors.name}
            autoComplete="name"
          />
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

          {/* campo de senha com toggle de visibilidade */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-zinc-600">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={values.password}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => handleChange("password", e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 ${
                  fieldErrors.password ? "border-red-300 bg-red-50/40" : "border-zinc-200 bg-white"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer p-2 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          {apiError && <p className="text-sm text-red-400">{apiError}</p>}

          <button
            type="submit"
            disabled={loading}
            onTouchEnd={(e) => e.stopPropagation()}
            className="mt-2 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
