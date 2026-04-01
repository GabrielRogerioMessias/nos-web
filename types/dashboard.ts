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
  initialBalance: number;
  color: string;
  active: boolean;
}
