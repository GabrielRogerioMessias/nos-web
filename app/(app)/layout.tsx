import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthGuard } from "@/components/AuthGuard";
import { TransactionProvider } from "@/components/transactions/TransactionContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TransactionProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pb-20 md:pb-0 md:pl-64">
            <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </TransactionProvider>
    </AuthGuard>
  );
}
