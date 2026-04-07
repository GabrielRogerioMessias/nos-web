import { api } from "./api";
import type {
  TransactionRequest,
  TransactionResponse,
  CategoryResponse,
  PageResponse,
} from "@/types/dashboard";

export interface TransactionFilters {
  accountId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export async function getTransactions(
  page = 0,
  filters: TransactionFilters = {},
  size = 200
): Promise<PageResponse<TransactionResponse>> {
  const params: Record<string, string | number> = { page, size };
  if (filters.accountId) params.accountId = filters.accountId;
  if (filters.type) params.type = filters.type;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  const { data } = await api.get<PageResponse<TransactionResponse>>("/transactions", { params });
  return data;
}

export async function createTransaction(payload: TransactionRequest): Promise<TransactionResponse> {
  const { data } = await api.post<TransactionResponse>("/transactions", payload);
  return data;
}

export async function updateTransaction(id: string, payload: TransactionRequest): Promise<TransactionResponse> {
  const { data } = await api.put<TransactionResponse>(`/transactions/${id}`, payload);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`);
}

export async function getTransaction(id: string): Promise<TransactionResponse> {
  const { data } = await api.get<TransactionResponse>(`/transactions/${id}`);
  return data;
}

export async function getCategories(type: "INCOME" | "EXPENSE"): Promise<CategoryResponse[]> {
  const { data } = await api.get<CategoryResponse[]>("/categories", { params: { type } });
  return data;
}
