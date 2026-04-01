import { api } from "./api";
import type { CreditCardRequest, CreditCardResponse, InvoiceResponse } from "@/types/dashboard";

export async function getCreditCards(): Promise<CreditCardResponse[]> {
  const { data } = await api.get<CreditCardResponse[]>("/credit-cards");
  return data;
}

export async function createCreditCard(payload: CreditCardRequest): Promise<CreditCardResponse> {
  const { data } = await api.post<CreditCardResponse>("/credit-cards", payload);
  return data;
}

export async function updateCreditCard(id: string, payload: CreditCardRequest): Promise<CreditCardResponse> {
  const { data } = await api.put<CreditCardResponse>(`/credit-cards/${id}`, payload);
  return data;
}

export async function deleteCreditCard(id: string): Promise<void> {
  await api.delete(`/credit-cards/${id}`);
}

export async function getInvoice(id: string, month: string): Promise<InvoiceResponse> {
  const { data } = await api.get<InvoiceResponse>(`/credit-cards/${id}/invoice`, {
    params: { month },
  });
  return data;
}
