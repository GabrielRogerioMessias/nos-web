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
