import { api } from "./api";
import type {
  BalanceResponse,
  IncomeVsExpenseResponse,
  AccountResponse,
} from "@/types/dashboard";

export interface CashflowResponse {
  currentBalance: number;
  committedRecurring: number;
  committedInvoices: number;
  savedForInvoices: number;
  freeBalance: number;
}

export async function getBalance(): Promise<BalanceResponse> {
  const { data } = await api.get<BalanceResponse>("/transactions/balance");
  return data;
}

export async function getIncomeVsExpense(months = 6): Promise<IncomeVsExpenseResponse> {
  const { data } = await api.get<IncomeVsExpenseResponse>(
    "/transactions/income-vs-expense",
    { params: { months } }
  );
  return data;
}

export async function getAccounts(): Promise<AccountResponse[]> {
  const { data } = await api.get<AccountResponse[]>("/accounts");
  return data;
}

export async function getCashflow(month?: string): Promise<CashflowResponse> {
  const params = month ? { month } : {};
  const { data } = await api.get<CashflowResponse>("/transactions/cashflow", { params });
  return data;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  color: string;
  totalAmount: number;
  percentage: number;
}

export interface MonthlySummaryResponse {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: CategoryExpense[];
}

export async function getMonthlySummary(month: string): Promise<MonthlySummaryResponse> {
  const { data } = await api.get<MonthlySummaryResponse>(`/transactions/summary/${month}`);
  return data;
}
