import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, id, options, ...props }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:text-zinc-50 dark:focus:border-zinc-500 dark:[color-scheme:dark] ${
          error
            ? "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/40"
            : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        }`}
        {...props}
      >
        <option value="">Selecionar...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
