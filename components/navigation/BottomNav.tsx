"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScrollText, CreditCard, Plus, UserCircle } from "lucide-react";
import { useTransactionForm } from "@/components/transactions/TransactionContext";

const leftItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/extrato", label: "Extrato", icon: ScrollText },
];

const rightItems = [
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/profile", label: "Perfil", icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openTransactionForm } = useTransactionForm();

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
          isActive ? "text-zinc-900" : "text-zinc-400"
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
        <span className={isActive ? "font-medium" : "font-normal"}>{label}</span>
      </Link>
    );
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-zinc-200 bg-white">
      {leftItems.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}

      {/* botão central */}
      <div className="flex flex-col items-center px-3 pb-3 pt-2">
        <button
          onClick={openTransactionForm}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800"
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>

      {rightItems.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}
