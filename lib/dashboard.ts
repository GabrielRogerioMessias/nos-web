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
