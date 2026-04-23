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

export async function updateProfile(payload: { name: string; email: string }): Promise<UserResponse> {
  const { data } = await api.put<UserResponse>("/auth/update-profile", payload);
  return data;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  await api.post("/auth/change-password", payload);
}

export async function completeOnboarding(): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>("/auth/complete-onboarding");
  return data;
}

export async function acceptTerms(): Promise<void> {
  await api.post("/auth/accept-terms", { version: "1.0" });
}

export async function exportUserData(): Promise<Blob> {
  const { data } = await api.get<Blob>("/auth/export-data", {
    responseType: "blob",
  });
  return data;
}

export async function deleteAccount(): Promise<void> {
  await api.delete("/auth/delete-account");
}
