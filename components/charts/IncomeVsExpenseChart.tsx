"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonthSummary } from "@/types/dashboard";

const COLOR_INCOME = "#10b981";
const COLOR_EXPENSE = "#71717a";

function formatCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

// "2026-04" → "Abr/26"
function formatMonthLabel(raw: string): string {
  const parts = raw.split("-");
  if (parts.length < 2) return raw;
  const [year, month] = parts;
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "short" });
  return `${label.replace(".", "")}/\u200B${String(year).slice(2)}`;
}

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: "#18181b",
        borderColor: "#27272a",
        color: "#f4f4f5",
        border: "1px solid #27272a",
      }}
      className="rounded-lg px-3.5 py-3 shadow-lg"
    >
      <p className="mb-2 text-xs font-medium" style={{ color: "#a1a1aa" }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span style={{ color: "#a1a1aa" }}>{entry.name}:</span>
          <span className="font-medium" style={{ color: "#f4f4f5" }}>
            {formatCurrencyFull(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  months: MonthSummary[];
}

export function IncomeVsExpenseChart({ months }: Props) {
  const data = months.slice(-6).map((m) => ({
    name: formatMonthLabel(m.month),
    Entradas: m.totalIncome,
    Saídas: m.totalExpense,
  }));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Receitas vs Despesas
        </p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_INCOME }}
            />
            Entradas
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_EXPENSE }}
            />
            Saídas
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="32%" barGap={3}>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-zinc-100 dark:stroke-zinc-800"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="fill-zinc-400 text-zinc-400 dark:fill-zinc-500 dark:text-zinc-500"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="fill-zinc-400 text-zinc-400 dark:fill-zinc-500 dark:text-zinc-500"
            tickLine={false}
            axisLine={false}
            width={85}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "currentColor", className: "text-zinc-100 dark:text-zinc-800 opacity-50" }}
          />
          <Bar
            dataKey="Entradas"
            fill={COLOR_INCOME}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={true}
          />
          <Bar
            dataKey="Saídas"
            fill={COLOR_EXPENSE}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeVsExpenseChartSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="flex h-[220px] items-end gap-3 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-end gap-1">
            <div
              className="w-full animate-pulse rounded-t bg-zinc-100 dark:bg-zinc-800"
              style={{ height: `${45 + Math.abs(Math.sin(i * 1.3)) * 80}px` }}
            />
            <div
              className="w-full animate-pulse rounded-t bg-zinc-200 dark:bg-zinc-700"
              style={{ height: `${35 + Math.abs(Math.cos(i * 1.1)) * 70}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
