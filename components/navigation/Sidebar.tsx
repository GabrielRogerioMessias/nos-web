"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScrollText, Landmark, CreditCard, Target, Tag, PiggyBank, Moon, Sun } from "lucide-react";
import { CalculatorWidget } from "@/components/ui/CalculatorWidget";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/extrato", label: "Extrato", icon: ScrollText },
  { href: "/contas", label: "Contas", icon: Landmark },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/categorias", label: "Categorias", icon: Tag },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/cofres", label: "Cofres", icon: PiggyBank },
];

function NavTooltip({ label, visible }: { label: string; visible: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 shadow-sm transition-opacity duration-150 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {label}
    </span>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  expanded,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  expanded: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (!expanded) {
      timerRef.current = setTimeout(() => setTooltipVisible(true), 2000);
    }
  }

  function handleMouseLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTooltipVisible(false);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (expanded) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTooltipVisible(false);
    }
  }, [expanded]);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={href}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          isActive
            ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }`}
      >
        <Icon size={17} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" />
        <span
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
            expanded ? "w-auto opacity-100" : "w-0 opacity-0"
          }`}
        >
          {label}
        </span>
      </Link>
      {!expanded && <NavTooltip label={label} visible={tooltipVisible} />}
    </div>
  );
}

function ThemeItem({ expanded }: { expanded: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : false;
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Claro" : "Escuro";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      <Icon size={17} strokeWidth={1.5} className="flex-shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          expanded ? "w-auto opacity-100" : "w-0 opacity-0"
        }`}
      >
        Aparência: {label}
      </span>
    </button>
  );
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  const initials = "EU";

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`hidden md:flex fixed top-0 left-0 z-40 h-full flex-col border-r border-zinc-200 bg-white py-8 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950 ${
        expanded ? "w-60 px-4" : "w-16 px-3"
      }`}
    >
      {/* marca */}
      <div className={`mb-10 flex items-center ${expanded ? "px-2" : "justify-center"}`}>
        <span className="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
          {expanded ? "NOS" : "N"}
        </span>
      </div>

      {/* nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            expanded={expanded}
          />
        ))}
      </nav>

      {/* rodapé: perfil + toggle de tema */}
      <div className="mt-auto flex flex-col gap-1">
        <div className="relative flex items-center">
          <Link
            href="/profile"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              pathname === "/profile"
                ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <span className="flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {initials}
            </span>
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                expanded ? "w-auto opacity-100" : "w-0 opacity-0"
              }`}
            >
              Perfil
            </span>
          </Link>
        </div>

        {/* calculadora */}
        <CalculatorWidget expanded={expanded} />

        {/* theme toggle */}
        <ThemeItem expanded={expanded} />
      </div>
    </aside>
  );
}
