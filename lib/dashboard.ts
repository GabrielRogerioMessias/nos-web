import { api } from "./api";
import type {
  BalanceResponse,
  IncomeVsExpenseResponse,
  AccountResponse,
} from "@/types/dashboard";

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
