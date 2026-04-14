export interface BalanceResponse {
  totalAccounts: number;
  totalVaults: number;
  totalGeneralVaults: number;
  totalInvoiceVaults: number;
  availableBalance: number;
  netWorth: number;
}

export interface MonthSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface IncomeVsExpenseResponse {
  months: MonthSummary[];
}

export interface AccountResponse {
  id: string;
  name: string;
  type: string;
  bankName?: string;
  initialBalance: number | null;
  currentBalance: number | null;
  retainedInVaults: number;
  totalBalance: number;
  color: string;
  active: boolean;
}

export interface AccountBalanceResponse {
  id: string;
  name: string;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
}

export type AccountType = "CHECKING" | "SAVINGS" | "INVESTMENT" | "WALLET";

export interface AccountRequest {
  name: string;
  type: AccountType;
  bankName?: string;
  initialBalance?: number;
  color?: string;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface CategoryResponse {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  transactionDate: string;
  category: CategoryResponse;
  account: { id: string; name: string } | null;
  creditCard?: { id: string; name: string } | null;
  invoicePaid?: boolean;
  installmentPlanId?: string;
  recurringTransactionId?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
}

export interface TransactionRequest {
  type: TransactionType;
  description: string;
  amount: number;
  categoryId?: string;
  accountId?: string;
  destinationAccountId?: string;
  creditCardId?: string;
  transactionDate: string;
}

// ─── Recurring Transactions ───────────────────────────────────────────────────

export type RecurringFrequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "SEMIANNUAL"
  | "ANNUAL";

export interface RecurringTransactionRequest {
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId?: string;
  frequency: RecurringFrequency;
  startDate: string;
  payFirstInstallmentNow?: boolean;
}

// ─── Credit Cards ─────────────────────────────────────────────────────────────

export interface CreditCardRequest {
  name: string;
  brand?: string;
  closingDay: number;
  dueDay: number;
  creditLimit?: number;
  color?: string;
}

export interface CreditCardResponse {
  id: string;
  name: string;
  brand?: string;
  closingDay: number;
  dueDay: number;
  creditLimit?: number;
  availableLimit?: number;
  color?: string;
  active: boolean;
}

export interface InvoiceTransaction {
  id: string;
  description: string;
  amount: number;
  transactionDate: string;
  category?: { name: string };
  type?: string;
}

export interface InvoiceResponse {
  month: string;
  closingDate: string;
  dueDate: string;
  totalAmount: number;
  paid: boolean;
  transactions: InvoiceTransaction[];
}

export interface InvoicePaymentRequest {
  accountId?: string;
  vaultId?: string;
  month: string;
  amount: number;
  paymentDate: string;
}

// ─── Installment Plans ────────────────────────────────────────────────────────

export interface InstallmentPlanRequest {
  description: string;
  totalAmount: number;
  totalInstallments: number;
  creditCardId: string;
  categoryId: string;
  firstInstallmentDate: string;
}
