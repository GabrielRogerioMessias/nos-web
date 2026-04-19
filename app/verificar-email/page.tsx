"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import { api } from "@/lib/api";

type Status = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "loading" : "no-token");

  useEffect(() => {
    if (!token) return;

    api
      .post("/auth/verify-email", { token })
      .then(() => {
        localStorage.removeItem("show_email_verification_banner");
        setStatus("success");
        setTimeout(() => router.push("/"), 2000);
      })
      .catch((err: AxiosError) => {
        void err;
        setStatus("error");
      });
  }, [token, router]);

  if (status === "no-token") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-red-400">Link inválido.</p>
        <Link
          href="/cadastro"
          className="text-sm text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
        >
          Criar nova conta
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Verificando...</p>;
  }

  if (status === "success") {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        E-mail confirmado com sucesso! Redirecionando...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-red-400">Link inválido ou expirado.</p>
      <Link
        href="/cadastro"
        className="text-sm text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
      >
        Solicitar novo link
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">NOS</p>
        <h1 className="mb-6 text-xl font-medium text-zinc-900 dark:text-zinc-100">
          Verificação de e-mail
        </h1>

        <Suspense fallback={<p className="text-sm text-zinc-500">Carregando...</p>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
