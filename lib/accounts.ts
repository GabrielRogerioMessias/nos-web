import { api } from "./api";
import type { AccountResponse, AccountRequest, AccountBalanceResponse } from "@/types/dashboard";

export async function getAccounts(): Promise<AccountResponse[]> {
  const { data } = await api.get<AccountResponse[]>("/accounts");
  return data;
}

export async function createAccount(payload: AccountRequest): Promise<AccountResponse> {
  const { data } = await api.post<AccountResponse>("/accounts", payload);
  return data;
}

export async function updateAccount(id: string, payload: AccountRequest): Promise<AccountResponse> {
  const { data } = await api.put<AccountResponse>(`/accounts/${id}`, payload);
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}

export async function toggleAccount(id: string): Promise<void> {
  await api.patch(`/accounts/${id}/toggle`);
}

export async function getAccountBalance(id: string): Promise<AccountBalanceResponse> {
  const { data } = await api.get<AccountBalanceResponse>(`/accounts/${id}/balance`);
  return data;
}
