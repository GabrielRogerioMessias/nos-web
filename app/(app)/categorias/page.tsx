"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/categories";
import type { CategoryItem, CategoryRequest } from "@/lib/categories";
import { CategoryFormModal } from "@/components/categories/CategoryFormModal";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";

let toastId = 0;

type Tab = "EXPENSE" | "INCOME";

// ─── icon renderer ────────────────────────────────────────────────────────────

function CategoryIcon({ name, color }: { name: string; color: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<LucideProps> | undefined;
  return (
    <div
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: color }}
    >
      {Icon ? <Icon size={16} color="#fff" /> : (
        <span className="text-[10px] font-bold text-white">{name.slice(0, 2)}</span>
      )}
    </div>
  );
}

// ─── skeletons ────────────────────────────────────────────────────────────────

function CategoryListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-3.5 w-36 animate-pulse rounded bg-zinc-200" />
          <div className="ml-auto h-3 w-12 animate-pulse rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

// ─── modal de confirmação de exclusão ─────────────────────────────────────────

interface DeleteConfirmProps {
  category: CategoryItem;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function DeleteConfirmModal({ category, onConfirm, onClose }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20" onClick={!loading ? onClose : undefined} />
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-white p-6">
        <p className="text-sm font-medium text-zinc-900">Excluir categoria</p>
        <p className="mt-1.5 text-sm text-zinc-500">
          Tem certeza que deseja excluir{" "}
          <span className="font-medium text-zinc-700">"{category.name}"</span>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── página ───────────────────────────────────────────────────────────────────

export default function CategoriasPage() {
  const [tab, setTab] = useState<Tab>("EXPENSE");
  const [categories, setCategories] = useState<CategoryItem[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryItem | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  function addToast(message: string, type: ToastData["type"] = "success") {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  const loadCategories = useCallback(async (t: Tab) => {
    setCategories(null);
    try {
      const data = await getCategories(t);
      setCategories(data);
    } catch {
      addToast("Não foi possível carregar as categorias.", "error");
      setCategories([]);
    }
  }, []);

  useEffect(() => { loadCategories(tab); }, [tab, loadCategories]);

  function openNew() { setEditing(null); setFormOpen(true); }
  function openEdit(cat: CategoryItem) { setEditing(cat); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditing(null); }

  async function handleSave(payload: CategoryRequest) {
    if (editing) {
      await updateCategory(editing.id, payload);
      addToast("Categoria atualizada.");
    } else {
      await createCategory(payload);
      addToast("Categoria criada.");
    }
    closeForm();
    loadCategories(tab);
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteCategory(pendingDelete.id);
    addToast("Categoria excluída.");
    setPendingDelete(null);
    loadCategories(tab);
  }

  const shown = categories ?? [];

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-zinc-900">Categorias</h1>
            {categories !== null && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {shown.length === 0
                  ? "Nenhuma categoria"
                  : `${shown.length} categoria${shown.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Plus size={15} />
            Nova categoria
          </button>
        </div>

        {/* abas */}
        <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          {([["EXPENSE", "Despesas"], ["INCOME", "Receitas"]] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === key ? "bg-white text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* lista */}
        {categories === null ? (
          <CategoryListSkeleton />
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center">
            <p className="text-sm text-zinc-400">Nenhuma categoria encontrada.</p>
            <p className="mt-1 text-xs text-zinc-300">Clique em "Nova categoria" para começar.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {shown.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5">
                <CategoryIcon name={cat.icon} color={cat.color} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-900">{cat.name}</p>
                  {cat.isDefault && (
                    <p className="text-xs text-zinc-400">Padrão do sistema</p>
                  )}
                </div>

                {!cat.isDefault && (
                  <div className="flex flex-shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => openEdit(cat)}
                      className="rounded p-1.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(cat)}
                      className="rounded p-1.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500"
                      aria-label="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <CategoryFormModal
          editing={editing}
          defaultType={tab}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          category={pendingDelete}
          onConfirm={handleDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </>
  );
}
