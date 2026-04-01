export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Saudação */}
      <div>
        <p className="text-sm text-zinc-500">Bom dia</p>
        <div className="mt-1 h-6 w-32 animate-pulse rounded bg-zinc-200" />
      </div>

      {/* Card de saldo */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Saldo total</p>
        <div className="mt-3 h-10 w-48 animate-pulse rounded bg-zinc-200" />

        <div className="my-5 border-t border-zinc-100" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-400">Receitas</p>
            <div className="mt-2 h-5 w-24 animate-pulse rounded bg-zinc-200" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Despesas</p>
            <div className="mt-2 h-5 w-24 animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      </div>

      {/* Transações recentes */}
      <div>
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-200" />
                  <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
