import { api } from "./api";
import type { GoalRequest, GoalResponse, PageResponseGoal } from "@/types/goals";

export async function getGoals(page = 0): Promise<PageResponseGoal> {
  const { data } = await api.get<PageResponseGoal>("/goals", { params: { page } });
  return data;
}

export async function createGoal(payload: GoalRequest): Promise<GoalResponse> {
  const { data } = await api.post<GoalResponse>("/goals", payload);
  return data;
}

export async function updateGoal(id: string, payload: GoalRequest): Promise<GoalResponse> {
  const { data } = await api.put<GoalResponse>(`/goals/${id}`, payload);
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`/goals/${id}`);
}

export async function achieveGoal(id: string): Promise<void> {
  await api.patch(`/goals/${id}/achieve`);
}
