"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, CheckCircle2, AlertCircle, Download, Trash2, Moon, Sun } from "lucide-react";
import { AxiosError } from "axios";
import { getMe, updateProfile, changePassword, exportUserData, deleteAccount } from "@/lib/user";
import { api } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import type { UserResponse } from "@/types/auth";
import { ToastContainer, type ToastData } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500";

type ProfileTab = "personal" | "security" | "advanced";

const profileTabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "personal", label: "Dados Pessoais" },
  { id: "security", label: "Segurança" },
  { id: "advanced", label: "Avançado" },
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function Avatar({ user }: { user: UserResponse }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="h-20 w-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
      />
    );
  }
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
      <span className="text-xl font-medium text-zinc-600 select-none dark:text-zinc-300">
        {getInitials(user.name)}
      </span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-center gap-4 pb-8 border-b border-zinc-100 dark:border-zinc-800">
        <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-5 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <div className="h-3.5 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

function ProfileHeaderActions({ onLogout }: { onLogout: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <div className="mt-4 flex justify-center gap-4">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        disabled={!mounted}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      >
        {mounted && isDark ? <Sun size={15} strokeWidth={1.7} /> : <Moon size={15} strokeWidth={1.7} />}
        Tema
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
      >
        <LogOut size={15} strokeWidth={1.7} />
        Sair
      </button>
    </div>
  );
}

function PersonalDataSection({
  user,
  onUserUpdated,
  addToast,
  isResending,
  onResendVerification,
}: {
  user: UserResponse;
  onUserUpdated: (user: UserResponse) => void;
  addToast: (msg: string, type?: ToastData["type"]) => void;
  isResending: boolean;
  onResendVerification: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
  }, [user.email, user.name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const emailChanged = trimmedEmail !== user.email;

    if (!trimmedName) {
      addToast("Informe seu nome.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      addToast("Informe um e-mail válido.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await updateProfile({ name: trimmedName, email: trimmedEmail });
      onUserUpdated(updatedUser);
      addToast("Perfil atualizado com sucesso");
      if (emailChanged) {
        addToast("Verifique sua caixa de entrada para confirmar o novo e-mail");
      }
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao atualizar perfil. Tente novamente.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  }

  const unchanged = name.trim() === user.name && email.trim() === user.email;

  return (
    <section>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSavingProfile}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSavingProfile}
            className={inputClass}
          />
          {user.emailVerified ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-500" />
              <span className="text-xs text-emerald-700 dark:text-emerald-500">E-mail verificado</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={13} className="text-amber-500 dark:text-amber-400" />
                <span className="text-xs text-amber-600 dark:text-amber-400">E-mail não verificado</span>
              </div>
              <button
                type="button"
                onClick={onResendVerification}
                disabled={isResending}
                className="w-fit text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {isResending ? "Enviando..." : "Reenviar e-mail de verificação"}
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSavingProfile || unchanged}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSavingProfile ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </section>
  );
}

function SecuritySection({
  addToast,
}: {
  addToast: (msg: string, type?: ToastData["type"]) => void;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  function clearPasswordFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 8) {
      addToast("A nova senha deve ter pelo menos 8 caracteres.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast("As senhas não coincidem.", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      addToast("Senha alterada com sucesso. Faça login novamente.");
      setTimeout(() => {
        clearTokens();
        document.cookie = "accessToken=; Max-Age=0; path=/";
        document.cookie = "refreshToken=; Max-Age=0; path=/";
        router.push("/login");
      }, 1200);
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao alterar senha. Tente novamente.", "error");
      clearPasswordFields();
      setIsChangingPassword(false);
    }
  }

  return (
    <section>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
            Senha Atual
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={isChangingPassword}
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
            Nova Senha
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={isChangingPassword}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
            Confirmar Nova Senha
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isChangingPassword}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isChangingPassword ? "Alterando..." : "Alterar senha"}
        </button>
      </form>
    </section>
  );
}

function DataPrivacySection({
  addToast,
}: {
  addToast: (msg: string, type?: ToastData["type"]) => void;
}) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const canDeleteAccount = deleteConfirmation === "EXCLUIR";

  function closeDeleteModal() {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setDeleteConfirmation("");
  }

  async function handleExportData() {
    setIsExporting(true);
    try {
      const blob = await exportUserData();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "meus-dados-nos.json";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast("Download dos seus dados iniciado.");
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao exportar seus dados. Tente novamente.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!canDeleteAccount) {
      addToast("Digite EXCLUIR para confirmar a exclusão.", "error");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      setDeleteModalOpen(false);
      setDeleteConfirmation("");
      clearTokens();
      document.cookie = "accessToken=; Max-Age=0; path=/";
      document.cookie = "refreshToken=; Max-Age=0; path=/";
      addToast("Conta excluída com sucesso");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao excluir a conta. Tente novamente.", "error");
      setIsDeleting(false);
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={closeDeleteModal}
        disabled={isDeleting}
        className="flex-1 rounded-lg px-4 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={isDeleting || !canDeleteAccount}
        className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-600"
      >
        {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
      </button>
    </div>
  );

  return (
    <section className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Dados e Privacidade
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Exporte suas informações ou solicite a exclusão permanente da sua conta.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleExportData}
          disabled={isExporting || isDeleting}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Download size={15} strokeWidth={1.5} />
          {isExporting ? "Exportando..." : "Exportar meus dados"}
        </button>

        <button
          type="button"
          onClick={() => {
            setDeleteConfirmation("");
            setDeleteModalOpen(true);
          }}
          disabled={isExporting || isDeleting}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <Trash2 size={15} strokeWidth={1.5} />
          Excluir conta permanentemente
        </button>
      </div>

      {deleteModalOpen && (
        <Modal
          title="Excluir sua conta?"
          onClose={closeDeleteModal}
          disableOverlayClose={isDeleting}
          footer={footer}
        >
          <div className="space-y-5">
            <div className="space-y-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              <p>Esta ação é permanente e não pode ser desfeita.</p>
              <div>
                <p>Todos os seus dados serão apagados:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Contas bancárias e saldos</li>
                  <li>Cartões de crédito e faturas</li>
                  <li>Cofres e metas</li>
                  <li>Transações e histórico completo</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Para confirmar, digite EXCLUIR
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                disabled={isDeleting}
                autoComplete="off"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
                placeholder="EXCLUIR"
              />
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const addToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  }, []);

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleResendVerification() {
    setIsResending(true);
    try {
      await api.post("/auth/resend-verification");
      addToast("E-mail enviado! Verifique sua caixa de entrada.");
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
      addToast(msg ?? "Erro ao enviar e-mail. Tente novamente.", "error");
    } finally {
      setIsResending(false);
    }
  }

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <h1 className="mb-8 text-xl font-medium text-zinc-900 dark:text-zinc-50">Perfil</h1>

      {loading ? (
        <ProfileSkeleton />
      ) : user ? (
        <>
          <div className="flex flex-col items-center gap-3 pb-8 border-b border-zinc-100 dark:border-zinc-800">
            <Avatar user={user} />
            <div className="text-center">
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">{user.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
            </div>
            <ProfileHeaderActions onLogout={handleLogout} />
          </div>

          <div className="mt-6 flex rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {profileTabs.map((tab) => {
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                    selected
                      ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                  aria-pressed={selected}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="pt-8">
            {activeTab === "personal" && (
              <PersonalDataSection
                user={user}
                onUserUpdated={setUser}
                addToast={addToast}
                isResending={isResending}
                onResendVerification={handleResendVerification}
              />
            )}

            {activeTab === "security" && <SecuritySection addToast={addToast} />}

            {activeTab === "advanced" && (
              <DataPrivacySection addToast={addToast} />
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Não foi possível carregar o perfil.</p>
      )}
    </div>
  );
}
