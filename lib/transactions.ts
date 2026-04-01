import { api } from "./api";
import type {
  TransactionRequest,
  TransactionResponse,
  CategoryResponse,
  PageResponse,
} from "@/types/dashboard";

export async function getTransactions(page = 0): Promise<PageResponse<TransactionResponse>> {
  const { data } = await api.get<PageResponse<TransactionResponse>>("/transactions", {
    params: { page },
  });
  return data;
}

export async function createTransaction(payload: TransactionRequest): Promise<TransactionResponse> {
  const { data } = await api.post<TransactionResponse>("/transactions", payload);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`);
}

export async function getCategories(type: "INCOME" | "EXPENSE"): Promise<CategoryResponse[]> {
  const { data } = await api.get<CategoryResponse[]>("/categories", { params: { type } });
  return data;
}
