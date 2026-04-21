import { api } from "./api";
import type { UserResponse } from "@/types/auth";

export async function getMe(): Promise<UserResponse> {
  const { data } = await api.get<UserResponse>("/auth/me");
  return data;
}

export async function updateMe(payload: { name: string }): Promise<UserResponse> {
  const { data } = await api.put<UserResponse>("/auth/me", payload);
  return data;
}

export async function completeOnboarding(): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>("/auth/complete-onboarding");
  return data;
}
