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
  netAvailableWealth: number;
  availableVaultsBalance: number;
  goalVaultsBalance: number;
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

// Shape real retornado pela API antes da normalização
interface RawCategoryExpense {
  category: { id?: string; name: string; color?: string; [key: string]: unknown };
  total: number;
  percent: number;
}

export interface MonthlySummaryResponse {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: CategoryExpense[];
}

export async function getMonthlySummary(month: string): Promise<MonthlySummaryResponse> {
  const { data } = await api.get<{
    month?: string;
    totalIncome?: number;
    totalExpense?: number;
    balance?: number;
    expensesByCategory?: RawCategoryExpense[];
  }>(`/transactions/summary/${month}`);

  const categories: CategoryExpense[] = (data.expensesByCategory ?? []).map(
    (c): CategoryExpense => ({
      categoryId: c.category?.id ?? "",
      categoryName: c.category?.name ?? "",
      color: c.category?.color ?? "",
      totalAmount: c.total ?? 0,
      percentage: c.percent ?? 0,
    })
  );

  return {
    month: data.month ?? month,
    totalIncome: data.totalIncome ?? 0,
    totalExpense: data.totalExpense ?? 0,
    balance: data.balance ?? 0,
    expensesByCategory: categories,
  };
}
