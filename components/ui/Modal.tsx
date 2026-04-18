"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  /** Título exibido no cabeçalho */
  title?: React.ReactNode;
  /** Conteúdo scrollável do modal */
  children: React.ReactNode;
  /** Rodapé fixo (botões de ação) */
  footer?: React.ReactNode;
  onClose: () => void;
  /** Impede fechar ao clicar no overlay (ex.: enquanto salva) */
  disableOverlayClose?: boolean;
}

/**
 * Modal responsivo:
 * - md+  → dialog centralizado flutuante
 * - < md → bottom sheet blindado:
 *   • z-[9999] sobre tudo (BottomNav, etc.)
 *   • overlay bg-black/80 backdrop-blur-sm
 *   • max-h-[90dvh] — sem bug do 100vh no Chrome/Safari
 *   • header fixo + conteúdo scrollável (flex-1 overflow-y-auto) + footer fixo (pb-8)
 *   • body-lock via overflow:hidden no <body>
 */
export function Modal({ title, children, footer, onClose, disableOverlayClose = false }: ModalProps) {
  // body-lock — impede scroll do fundo enquanto o modal está aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // fecha com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !disableOverlayClose) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, disableOverlayClose]);

  return (
    <>
      {/* overlay — z-[9999] garante cobertura total incluindo BottomNav */}
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
        onClick={disableOverlayClose ? undefined : onClose}
      />

      {/* ── MOBILE: bottom sheet ──────────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col rounded-t-2xl bg-white md:hidden dark:bg-zinc-900" style={{ maxHeight: "90dvh" }}>
        {/* handle */}
        <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
          <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* cabeçalho fixo */}
        {title && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 px-5 pb-3 pt-2 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</span>
            <button
              onClick={onClose}
              disabled={disableOverlayClose}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* conteúdo scrollável — isolado, nunca vaza para o footer */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* rodapé fixo — pb-8 garante espaço acima da barra de gestos Android/iOS */}
        {footer && (
          <div className="flex-shrink-0 border-t border-zinc-100 bg-white px-5 pb-8 pt-3 dark:border-zinc-800 dark:bg-zinc-900">
            {footer}
          </div>
        )}
      </div>

      {/* ── DESKTOP: dialog centralizado ──────────────────────────────────────── */}
      <div className="fixed inset-x-4 top-1/2 z-[9999] mx-auto hidden max-w-md -translate-y-1/2 flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl md:flex dark:border-zinc-800 dark:bg-zinc-900">
        {/* cabeçalho */}
        {title && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</span>
            <button
              onClick={onClose}
              disabled={disableOverlayClose}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(90dvh - 130px)" }}>
          {children}
        </div>

        {/* rodapé */}
        {footer && (
          <div className="flex-shrink-0 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
