"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface ColorSelectOption {
  value: string;
  label: string;
  color?: string | null;
}

interface ColorSelectProps {
  label: string;
  options: ColorSelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

function ColorDot({ color }: { color?: string | null }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
      style={{ backgroundColor: color ?? "#d4d4d8" }}
    />
  );
}

export function ColorSelect({
  label,
  options,
  value,
  onChange,
  error,
  disabled,
  placeholder = "Selecionar...",
}: ColorSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  // fecha ao clicar fora
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // fecha com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      <label htmlFor={inputId} className="text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </label>

      {/* trigger */}
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors ${
          open ? "border-zinc-400 dark:border-zinc-500" : "border-zinc-200 dark:border-zinc-700"
        } ${
          error
            ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
            : "bg-white dark:bg-zinc-900"
        } ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600"
        }`}
      >
        <span className="flex items-center gap-2.5">
          {selected ? (
            <>
              <ColorDot color={selected.color} />
              <span className="text-zinc-900 dark:text-zinc-50">{selected.label}</span>
            </>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
          {options.length === 0 ? (
            <p className="px-3.5 py-2.5 text-sm text-zinc-400 dark:text-zinc-600">Nenhuma opção disponível.</p>
          ) : (
            options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                  o.value === value
                    ? "bg-zinc-50 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <ColorDot color={o.color} />
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
