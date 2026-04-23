"use client";

import { useRouter } from "next/navigation";

interface LegalPlaceholderPageProps {
  title: string;
  description: string;
}

export function LegalPlaceholderPage({ title, description }: LegalPlaceholderPageProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center">
        <article className="w-full rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            nós. legal
          </p>
          <h1 className="mt-4 text-2xl font-medium tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-200 p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Em breve.
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-8 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Voltar
          </button>
        </article>
      </div>
    </main>
  );
}
