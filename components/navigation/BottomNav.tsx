"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, ScrollText, PiggyBank, Plus, MoreHorizontal,
  CreditCard, Target, Landmark, Tag, Moon, Sun, UserCircle, X,
} from "lucide-react";
import { useTransactionForm } from "@/components/transactions/TransactionContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ─── itens fixos da barra inferior ────────────────────────────────────────────

const leftItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/extrato", label: "Extrato", icon: ScrollText },
];

const rightItems = [
  { href: "/cofres", label: "Cofres", icon: PiggyBank },
];

// ─── itens do menu "Mais" ─────────────────────────────────────────────────────

const moreItems = [
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/contas", label: "Contas", icon: Landmark },
  { href: "/categorias", label: "Categorias", icon: Tag },
];

// ─── link da barra inferior ───────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
        isActive
          ? "text-zinc-900 dark:text-zinc-50"
          : "text-zinc-400 dark:text-zinc-500"
      }`}
    >
      <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
      <span className={isActive ? "font-medium" : "font-normal"}>{label}</span>
    </Link>
  );
}

// ─── toggle de tema dentro do sheet ──────────────────────────────────────────

function ThemeRow({ onClose }: { onClose: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : false;
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      onClick={() => { setTheme(isDark ? "light" : "dark"); onClose(); }}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Icon size={17} className="text-zinc-500 dark:text-zinc-400" />
      </span>
      <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
    </button>
  );
}

// ─── bottom nav + sheet ───────────────────────────────────────────────────────

export function BottomNav() {
  const { openTransactionForm } = useTransactionForm();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // fecha o sheet ao navegar
  useEffect(() => { setSheetOpen(false); }, [pathname]);

  const isMoreActive = moreItems.some(
    (i) => pathname === i.href || pathname.startsWith(i.href),
  );

  return (
    <>
      {/* ── barra inferior ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {leftItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* botão central + */}
        <div className="flex flex-col items-center px-3 pb-3 pt-2">
          <button
            onClick={openTransactionForm}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={20} strokeWidth={2} />
          </button>
        </div>

        {rightItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* botão Menu */}
        <button
          onClick={() => setSheetOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
            isMoreActive
              ? "text-zinc-900 dark:text-zinc-50"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          <MoreHorizontal size={20} strokeWidth={isMoreActive ? 2 : 1.5} />
          <span className={isMoreActive ? "font-medium" : "font-normal"}>Menu</span>
        </button>
      </nav>

      {/* ── sheet overlay ── */}
      {sheetOpen && (
        <>
          {/* backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/30"
            onClick={() => setSheetOpen(false)}
          />

          {/* painel deslizante de baixo */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-zinc-200 bg-white pb-safe dark:border-zinc-800 dark:bg-zinc-950">

            {/* handle + fechar */}
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <div className="mx-auto h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Menu</p>
              <button
                onClick={() => setSheetOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>

            {/* perfil */}
            <div className="px-3 pb-2">
              <Link
                href="/profile"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  EU
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Meu Perfil</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Configurações da conta</p>
                </div>
                <UserCircle size={16} className="ml-auto flex-shrink-0 text-zinc-300 dark:text-zinc-600" />
              </Link>
            </div>

            <div className="mx-4 border-t border-zinc-100 dark:border-zinc-800" />

            {/* navegação extra */}
            <div className="grid grid-cols-2 gap-2 p-3">
              {moreItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-zinc-200 dark:bg-zinc-700"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    }`}>
                      <Icon size={17} className={isActive ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-500 dark:text-zinc-400"} />
                    </span>
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="mx-4 border-t border-zinc-100 dark:border-zinc-800" />

            {/* tema */}
            <div className="p-3">
              <ThemeRow onClose={() => setSheetOpen(false)} />
            </div>

            {/* safe area para iPhone */}
            <div className="h-4" />
          </div>
        </>
      )}
    </>
  );
}
