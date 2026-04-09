"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, parse, isValid } from "date-fns";
import { CalendarDays, X } from "lucide-react";

// ISO yyyy-MM-dd ↔ Date helpers
function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = parse(iso, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

function dateToIso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function dateToDisplay(d: Date): string {
  return format(d, "dd/MM/yyyy");
}

interface DatePickerProps {
  value?: string; // ISO yyyy-MM-dd
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecionar data",
  label,
  error,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = isoToDate(value ?? "");

  // fecha ao clicar fora
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // calcula posição fixed para o popover não ser cortado por overflow:hidden do modal
  function openPopover() {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const popoverH = 320; // altura estimada do calendário
      if (spaceBelow >= popoverH) {
        setPopoverStyle({ top: rect.bottom + 6, left: rect.left, width: rect.width });
      } else {
        setPopoverStyle({ bottom: window.innerHeight - rect.top + 6, left: rect.left, width: rect.width });
      }
    }
    setOpen((v) => !v);
  }

  function handleSelect(day: Date | undefined) {
    onChange(day ? dateToIso(day) : undefined);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(undefined);
  }

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      )}

      {/* trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openPopover}
        className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors
          ${open ? "border-zinc-400 dark:border-zinc-500" : "border-zinc-200 dark:border-zinc-700"}
          ${error ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40" : "bg-white dark:bg-zinc-900"}
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600"}
          ${selected ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400 dark:text-zinc-600"}`}
      >
        <span className="flex items-center gap-2.5">
          <CalendarDays size={15} className="flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
          {selected ? dateToDisplay(selected) : placeholder}
        </span>
        {selected && !disabled && (
          <X
            size={14}
            className="flex-shrink-0 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
            onClick={handleClear}
          />
        )}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* popover — fixed para não ser cortado por overflow:hidden de modais */}
      {open && (
        <div
          className="fixed z-[200] min-w-[280px] rounded-xl border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-700 dark:bg-zinc-900"
          style={popoverStyle}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={ptBR}
            weekStartsOn={0}
            showOutsideDays
            classNames={{
              root: "text-sm",
              months: "flex flex-col gap-4",
              month: "flex flex-col gap-3",
              month_caption: "flex items-center justify-between px-1 py-1",
              caption_label: "text-sm font-medium text-zinc-900 capitalize dark:text-zinc-50",
              nav: "flex items-center gap-1",
              button_previous:
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 [&_svg]:stroke-current [&_svg]:fill-none",
              button_next:
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 [&_svg]:stroke-current [&_svg]:fill-none",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "w-9 text-center text-[11px] font-normal text-zinc-400 pb-1.5 dark:text-zinc-600",
              weeks: "flex flex-col gap-0.5",
              week: "flex w-full",
              day: "relative flex h-9 w-9 items-center justify-center",
              day_button:
                "flex h-8 w-8 items-center justify-center rounded-lg text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-800",
              selected: "bg-zinc-900 rounded-lg [&>button]:text-white [&>button]:hover:bg-zinc-800 dark:bg-zinc-100 dark:[&>button]:text-zinc-900 dark:[&>button]:hover:bg-zinc-200",
              today: "[&>button]:font-semibold",
              outside: "[&>button]:text-zinc-300 dark:[&>button]:text-zinc-600",
              disabled: "opacity-30 cursor-not-allowed",
            }}
          />
        </div>
      )}
    </div>
  );
}
