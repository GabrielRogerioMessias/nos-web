"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastState } from "@/components/ui/useToastState";
import type { CategoryRequest, CategoryItem } from "@/lib/categories";
import { getApiErrorMessage } from "@/lib/api-error";

// ─── catálogo de ícones ───────────────────────────────────────────────────────

const ICON_NAMES = [
  "Home", "Car", "Utensils", "Coffee", "ShoppingCart", "Smartphone",
  "Heart", "Briefcase", "GraduationCap", "Plane", "Music", "Gamepad2",
  "Dumbbell", "Bus", "Pill", "Dog", "Baby", "Gift", "Wrench", "Zap",
  "Wallet", "TrendingUp", "Building2", "BookOpen",
] as const;

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<LucideProps> | undefined;
  if (!Icon) return <span className="text-[10px] text-zinc-400">{name.slice(0, 2)}</span>;
  return <Icon {...props} />;
}

// ─── paleta de cores ──────────────────────────────────────────────────────────

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#f43f5e", "#a3a3a3",
];

// ─── props ────────────────────────────────────────────────────────────────────

interface CategoryFormModalProps {
  editing: CategoryItem | null;
  defaultType?: "INCOME" | "EXPENSE";
  onSave: (payload: CategoryRequest) => Promise<void>;
  onClose: () => void;
}

export function CategoryFormModal({ editing, defaultType = "EXPENSE", onSave, onClose }: CategoryFormModalProps) {
  const { toasts, addToast, dismissToast } = useToastState();
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(
    (editing?.type as "INCOME" | "EXPENSE") ?? defaultType
  );
  const [icon, setIcon] = useState<string>(editing?.icon ?? "Wallet");
  const [color, setColor] = useState(editing?.color ?? COLORS[6]);
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError("Nome obrigatório."); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), type, icon, color });
    } catch (error) {
      addToast(getApiErrorMessage(error, "Erro ao salvar categoria. Tente novamente."), "error");
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Cancelar
      </button>
      <button
        form="category-form"
        type="submit"
        disabled={saving || !name.trim()}
        className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar categoria"}
      </button>
    </div>
  );

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Modal
        title={editing ? "Editar categoria" : "Nova categoria"}
        onClose={onClose}
        disableOverlayClose={saving}
        footer={footer}
      >
        <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* nome */}
        <Input
          label="Nome"
          placeholder="Ex: Alimentação, Salário"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError(""); }}
          error={nameError}
        />

        {/* tipo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Tipo</label>
          <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                type="button"
                disabled={!!editing}
                onClick={() => setType(t)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                  type === t
                    ? "bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-600 disabled:opacity-60 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
              >
                {t === "EXPENSE" ? "Despesa" : "Receita"}
              </button>
            ))}
          </div>
        </div>

        {/* paleta de cores */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Cor</label>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColor(hex)}
                className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none ${
                  color === hex ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
                }`}
                style={{ backgroundColor: hex }}
                aria-label={hex}
              >
                {color === hex && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* galeria de ícones */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Ícone</label>
          <div className="grid grid-cols-8 gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            {ICON_NAMES.map((n) => {
              const selected = icon === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setIcon(n)}
                  title={n}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                    selected
                      ? "scale-110 shadow-sm"
                      : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                  style={selected ? { backgroundColor: color } : {}}
                >
                  <DynamicIcon name={n} size={16} color={selected ? "#fff" : "#71717a"} />
                </button>
              );
            })}
          </div>
        </div>

        {/* preview */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: color }}
          >
            <DynamicIcon name={icon} size={16} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{name || "Nome da categoria"}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{type === "EXPENSE" ? "Despesa" : "Receita"}</p>
          </div>
        </div>
        </form>
      </Modal>
    </>
  );
}
