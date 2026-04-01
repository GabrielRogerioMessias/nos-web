"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScrollText, Landmark, CreditCard, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/extrato", label: "Extrato", icon: ScrollText },
  { href: "/contas", label: "Contas", icon: Landmark },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
];

function NavTooltip({ label, visible }: { label: string; visible: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 shadow-sm transition-opacity duration-150 ${
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

  // reset tooltip when sidebar expands
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
            ? "bg-zinc-100 text-zinc-900 font-medium"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
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

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  // initials for avatar (static — no user context at nav level)
  const initials = "EU";

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`hidden md:flex fixed top-0 left-0 z-40 h-full flex-col border-r border-zinc-200 bg-white py-8 transition-all duration-300 overflow-hidden ${
        expanded ? "w-60 px-4" : "w-16 px-3"
      }`}
    >
      {/* marca */}
      <div className={`mb-10 flex items-center ${expanded ? "px-2" : "justify-center"}`}>
        <span className="text-lg font-medium tracking-tight text-zinc-900">
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

      {/* avatar / perfil */}
      <div className="mt-auto">
        <div className="relative flex items-center">
          <Link
            href="/profile"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              pathname === "/profile"
                ? "bg-zinc-100 text-zinc-900 font-medium"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <span className="flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-medium text-zinc-600">
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
      </div>
    </aside>
  );
}
