import { api } from "./api";
import type { CreditCardRequest, CreditCardResponse, InvoiceResponse, InstallmentPlanRequest, InvoicePaymentRequest } from "@/types/dashboard";

export async function getCreditCards(): Promise<CreditCardResponse[]> {
  const { data } = await api.get<CreditCardResponse[]>("/credit-cards");
  return data;
}

export async function getCreditCard(id: string): Promise<CreditCardResponse> {
  const { data } = await api.get<CreditCardResponse>(`/credit-cards/${id}`);
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

export async function getCurrentInvoice(id: string): Promise<InvoiceResponse> {
  const { data } = await api.get<InvoiceResponse>(`/credit-cards/${id}/invoice`);
  return data;
}

export interface InstallmentPlan {
  id: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  paidInstallments: number;
  remainingAmount: number;
  creditCardId: string;
  creditCardName: string;
  creditCardColor?: string;
  categoryId?: string;
  categoryName?: string;
  firstInstallmentDate: string;
  nextInstallmentDate?: string;
  active: boolean;
}

export async function getInstallmentPlans(): Promise<InstallmentPlan[]> {
  const { data } = await api.get<InstallmentPlan[]>("/installment-plans");
  return data;
}

export async function createInstallmentPlan(payload: InstallmentPlanRequest): Promise<void> {
  await api.post("/installment-plans", payload);
}

export async function deleteInstallmentPlan(id: string): Promise<void> {
  await api.delete(`/installment-plans/${id}`);
}

export async function payInvoice(cardId: string, payload: InvoicePaymentRequest): Promise<void> {
  await api.post(`/credit-cards/${cardId}/pay`, payload);
}
