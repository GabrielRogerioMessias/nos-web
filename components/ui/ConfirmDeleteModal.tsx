"use client";

import { Loader2 } from "lucide-react";

interface Props {
  title: string;
  description: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ title, description, isLoading = false, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* caixa */}
      <div className="relative w-full max-w-sm rounded-t-2xl border border-zinc-200 bg-white p-6 md:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">{title}</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40 sm:w-auto dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40 sm:w-auto"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
