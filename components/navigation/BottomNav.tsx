"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScrollText, Landmark, CreditCard } from "lucide-react";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/extrato", label: "Extrato", icon: ScrollText },
  { href: "/contas", label: "Contas", icon: Landmark },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-zinc-200 bg-white">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
              isActive ? "text-zinc-900" : "text-zinc-400"
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span className={isActive ? "font-medium" : "font-normal"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
