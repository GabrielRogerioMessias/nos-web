"use client";

import { Receipt } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CategoryExpense } from "@/lib/dashboard";

const FALLBACK_COLOR = "#a1a1aa";

const PALETTE = [
  "#10b981", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa",
  "#facc15", "#2dd4bf", "#f87171", "#818cf8", "#4ade80",
];

function resolveColor(color: string | undefined | null, index: number): string {
  if (color && color !== "#000000" && color !== "#ffffff") return color;
  return PALETTE[index % PALETTE.length];
}

function formatCurrencyFull(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(safe);
}

interface TooltipItem extends CategoryExpense {
  resolvedColor: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipItem }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: "#18181b",
        border: "1px solid #27272a",
        color: "#f4f4f5",
      }}
      className="rounded-lg px-3.5 py-3 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: item.resolvedColor }}
        />
        <p className="text-xs font-medium" style={{ color: "#f4f4f5" }}>
          {item.categoryName}
        </p>
      </div>
      <p className="mt-1 text-xs" style={{ color: "#a1a1aa" }}>
        {formatCurrencyFull(item.totalAmount)}{" "}
        <span style={{ color: "#71717a" }}>· {(Number.isFinite(item.percentage) ? item.percentage : 0).toFixed(1)}%</span>
      </p>
    </div>
  );
}

// Empty state: donut cinza com texto central
function EmptyDonut({ month }: { month: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Despesas por categoria
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{month}</p>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative flex items-center justify-center">
          {/* círculo externo */}
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle
              cx="65"
              cy="65"
              r="50"
              fill="none"
              stroke="currentColor"
              strokeWidth="18"
              className="text-zinc-100 dark:text-zinc-800"
            />
          </svg>
          {/* texto central */}
          <div className="absolute flex flex-col items-center">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Sem gastos</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          Nenhuma despesa registrada em {month}.
        </p>
      </div>
    </div>
  );
}

interface Props {
  categories: CategoryExpense[];
  month: string;
}

export function ExpenseByCategoryChart({ categories, month }: Props) {
  const safe = (Array.isArray(categories) ? categories : []).filter(
    (c) => Number.isFinite(c.totalAmount) && c.totalAmount > 0
  );

  if (safe.length === 0) {
    return <EmptyDonut month={month} />;
  }

  const data: TooltipItem[] = safe.map((c, i) => ({
    ...c,
    resolvedColor: resolveColor(c.color, i),
  }));

  const total = data.reduce((s, c) => s + c.totalAmount, 0);
  const displayed = data.slice(0, 6);
  const rest = data.slice(6);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Despesas por categoria
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{month}</p>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            dataKey="totalAmount"
            nameKey="categoryName"
            paddingAngle={2}
            strokeWidth={0}
            isAnimationActive={true}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.resolvedColor} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="mt-2 space-y-2">
        {displayed.map((c) => (
          <li key={c.categoryId} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: c.resolvedColor }}
              />
              <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                {c.categoryName}
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-xs tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatCurrencyFull(c.totalAmount)}
              </span>
              <span className="w-8 text-right text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                {(Number.isFinite(c.percentage) ? c.percentage : 0).toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
        {rest.length > 0 && (
          <li className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              +{rest.length} outras categorias
            </span>
            <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
              {formatCurrencyFull(rest.reduce((s, c) => s + c.totalAmount, 0))}
            </span>
          </li>
        )}
        <li className="flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total</span>
          <span className="text-xs font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatCurrencyFull(total)}
          </span>
        </li>
      </ul>
    </div>
  );
}

// ─── lista mobile-first: barras de progresso horizontais ─────────────────────

interface ListProps {
  categories: CategoryExpense[];
  month: string;
  onNewTransaction?: () => void;
}

function formatCurrencyCompact(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(safe);
}

export function ExpenseByCategoryList({ categories, month, onNewTransaction }: ListProps) {
  const safe = (Array.isArray(categories) ? categories : []).filter(
    (c) => Number.isFinite(c.totalAmount) && c.totalAmount > 0
  );

  if (safe.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Onde seu dinheiro foi</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{month}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <Receipt className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="font-medium text-zinc-300">Nenhuma despesa neste mês</p>
          <p className="mt-1 max-w-sm text-center text-sm text-zinc-500">
            Os seus gastos aparecerão aqui divididos por categoria para você entender para onde seu dinheiro está indo.
          </p>
          {onNewTransaction && (
            <button
              onClick={onNewTransaction}
              className="mt-5 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              + Lançar primeira despesa
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayed = safe.slice(0, 7);
  const total = safe.reduce((s, c) => s + c.totalAmount, 0);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-baseline justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Onde seu dinheiro foi</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{month}</p>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
        {displayed.map((cat, i) => {
          const color = resolveColor(cat.color, i);
          const rawPct = Number.isFinite(cat.percentage) && cat.percentage > 0
            ? cat.percentage
            : total > 0 ? (cat.totalAmount / total) * 100 : 0;
          const pct = Math.min(100, Math.round(rawPct));
          return (
            <div key={cat.categoryId}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                    {cat.categoryName}
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-baseline gap-2">
                  <span className="text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatCurrencyFull(cat.totalAmount)}
                  </span>
                  <span className="w-8 text-right text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        {safe.length > 7 ? (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            +{safe.length - 7} outras · {formatCurrencyCompact(safe.slice(7).reduce((s, c) => s + c.totalAmount, 0))}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total</span>
          <span className="text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatCurrencyFull(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ExpenseByCategoryListSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="h-4 w-44 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <ul className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="h-3.5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="h-1.5 w-full animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExpenseByCategoryChartSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-baseline justify-between">
        <div className="h-4 w-44 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="my-4 flex justify-center">
        <div className="h-[130px] w-[130px] animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <ul className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </li>
        ))}
      </ul>
    </div>
  );
}
