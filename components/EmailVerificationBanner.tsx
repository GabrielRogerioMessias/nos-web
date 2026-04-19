"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function EmailVerificationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem("show_email_verification_banner");
    if (flag === "true") setVisible(true);
  }, []);

  function dismiss() {
    localStorage.removeItem("show_email_verification_banner");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      <p>
        Verifique sua caixa de entrada e confirme seu e-mail para proteger sua conta.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar aviso"
        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      >
        <X size={16} />
      </button>
    </div>
  );
}
