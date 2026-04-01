import { api } from "./api";
import type { UserResponse } from "@/types/auth";

export async function getMe(): Promise<UserResponse> {
  const { data } = await api.get<UserResponse>("/auth/me");
  return data;
}
