import { api } from "./api";

export interface CategoryRequest {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  isDefault: boolean;
}

export async function getCategories(type?: "INCOME" | "EXPENSE"): Promise<CategoryItem[]> {
  const params = type ? { type } : {};
  const { data } = await api.get<CategoryItem[]>("/categories", { params });
  return data;
}

export async function createCategory(payload: CategoryRequest): Promise<CategoryItem> {
  const { data } = await api.post<CategoryItem>("/categories", payload);
  return data;
}

export async function updateCategory(id: string, payload: CategoryRequest): Promise<CategoryItem> {
  const { data } = await api.put<CategoryItem>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
