export interface BalanceResponse {
  totalAccounts: number;
  totalVaults: number;
  availableBalance: number;
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
  initialBalance: number;
  currentBalance: number;
  color: string;
  active: boolean;
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
}

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  transactionDate: string;
  category: CategoryResponse;
  account: { id: string; name: string } | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
}

export interface TransactionRequest {
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  accountId?: string;
  transactionDate: string;
}
