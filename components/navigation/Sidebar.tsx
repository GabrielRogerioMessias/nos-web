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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 flex-col border-r border-zinc-200 bg-white px-4 py-8">
      <div className="mb-10 px-2">
        <span className="text-lg font-medium tracking-tight text-zinc-900">NOS</span>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-zinc-100 text-zinc-900 font-medium"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
