import { api } from "./api";

export interface VaultResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  currentBalance: number;
  active: boolean;
  vaultType?: "GENERAL" | "GOAL" | "INVOICE";
}

export interface VaultRequest {
  name: string;
  vaultType: "GENERAL" | "GOAL" | "INVOICE";
  description?: string;
  color?: string;
  icon?: string;
}

export interface VaultTransaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "YIELD";
  amount: number;
  description?: string;
  transactionDate: string;
  balanceAfter: number;
  account?: { id: string; name: string };
}

export interface VaultTransactionsResponse {
  content: VaultTransaction[];
  totalPages: number;
}

export async function getVaults(): Promise<VaultResponse[]> {
  const { data } = await api.get<VaultResponse[]>("/vaults");
  return data;
}

export async function createVault(payload: VaultRequest): Promise<VaultResponse> {
  const { data } = await api.post<VaultResponse>("/vaults", payload);
  return data;
}

export async function updateVault(id: string, payload: VaultRequest): Promise<VaultResponse> {
  const { data } = await api.put<VaultResponse>(`/vaults/${id}`, payload);
  return data;
}

export async function deleteVault(id: string): Promise<void> {
  await api.delete(`/vaults/${id}`);
}

export async function depositToVault(
  vaultId: string,
  amount: number,
  accountId: string,
  description?: string,
): Promise<void> {
  await api.post(`/vaults/${vaultId}/deposit`, { amount, accountId, description });
}

export async function withdrawFromVault(
  vaultId: string,
  amount: number,
  accountId: string,
  description?: string,
): Promise<void> {
  await api.post(`/vaults/${vaultId}/withdraw`, { amount, accountId, description });
}

export async function getVaultTransactions(
  vaultId: string,
  page = 0,
): Promise<VaultTransactionsResponse> {
  const { data } = await api.get<VaultTransactionsResponse>(
    `/vaults/${vaultId}/transactions`,
    { params: { page } },
  );
  return data;
}
