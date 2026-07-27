import apiClient from "./client";
import { User } from "@/lib/types";

export interface LoginResponse {
  token: string;
  user: Pick<User, "id" | "username" | "displayName" | "role">;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/api/auth/login", { username, password });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/api/auth/me");
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await apiClient.put("/api/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
}
