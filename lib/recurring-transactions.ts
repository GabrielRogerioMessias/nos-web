import { api } from "./api";
import type { RecurringTransactionRequest } from "@/types/dashboard";

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  frequency: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  accountId?: string;
  accountName?: string;
  startDate: string;
  nextDueDate?: string;
  active: boolean;
  totalAmountPaid?: number;
}

export async function getRecurringTransactions(active?: boolean): Promise<RecurringTransaction[]> {
  const params: Record<string, boolean> = {};
  if (active !== undefined) params.active = active;
  const { data } = await api.get<RecurringTransaction[]>("/recurring-transactions", { params });
  return data;
}

export async function getPendingRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data } = await api.get<RecurringTransaction[]>("/recurring-transactions/pending");
  return data;
}

export async function createRecurringTransaction(payload: RecurringTransactionRequest): Promise<void> {
  await api.post("/recurring-transactions", payload);
}

export async function payRecurringTransaction(id: string): Promise<void> {
  await api.post(`/recurring-transactions/${id}/pay`);
}

export async function toggleRecurringTransaction(id: string): Promise<void> {
  await api.patch(`/recurring-transactions/${id}/toggle`);
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  await api.delete(`/recurring-transactions/${id}`);
}
