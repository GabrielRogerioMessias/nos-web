import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AuthGuard } from "@/components/AuthGuard";
import { TransactionProvider } from "@/components/transactions/TransactionContext";
import { CalculatorProvider, CalculatorPortal } from "@/components/ui/CalculatorWidget";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { TermsGate } from "@/components/legal/TermsGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TransactionProvider>
        <CalculatorProvider>
          <EmailVerificationBanner />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-0 md:pl-16">
              <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
                <TermsGate>
                  <OnboardingGate>
                    {children}
                  </OnboardingGate>
                </TermsGate>
              </div>
            </main>
          </div>
          <BottomNav />
          <CalculatorPortal />
        </CalculatorProvider>
      </TransactionProvider>
    </AuthGuard>
  );
}
