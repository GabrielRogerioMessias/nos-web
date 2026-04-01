"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getMe } from "@/lib/user";
import { clearTokens } from "@/lib/auth";
import type { UserResponse } from "@/types/auth";

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
        className="h-20 w-20 rounded-full object-cover border border-zinc-200"
      />
    );
  }
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200">
      <span className="text-xl font-medium text-zinc-600 select-none">
        {getInitials(user.name)}
      </span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-center gap-4 pb-8 border-b border-zinc-100">
        <div className="h-20 w-20 rounded-full bg-zinc-100" />
        <div className="h-5 w-32 rounded bg-zinc-100" />
        <div className="h-4 w-48 rounded bg-zinc-100" />
      </div>
      <div className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <div className="h-3.5 w-12 rounded bg-zinc-100" />
          <div className="h-10 w-full rounded-lg bg-zinc-100" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-12 rounded bg-zinc-100" />
          <div className="h-10 w-full rounded-lg bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-8 text-xl font-medium text-zinc-900">Perfil</h1>

      {loading ? (
        <ProfileSkeleton />
      ) : user ? (
        <>
          <div className="flex flex-col items-center gap-3 pb-8 border-b border-zinc-100">
            <Avatar user={user} />
            <div className="text-center">
              <p className="text-base font-medium text-zinc-900">{user.name}</p>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Nome
              </label>
              <input
                type="text"
                value={user.name}
                disabled
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>

            <p className="text-xs text-zinc-400">
              A edição de perfil estará disponível em breve.
            </p>
          </div>

          <div className="mt-10 border-t border-zinc-100 pt-8">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 hover:border-red-100"
            >
              <LogOut size={15} strokeWidth={1.5} />
              Sair da conta
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Não foi possível carregar o perfil.</p>
      )}
    </div>
  );
}
