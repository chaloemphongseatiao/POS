import apiClient from "./client";
import { User, UserRole } from "@/lib/types";

export async function listUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/users");
  return data;
}

export async function createUser(body: {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}): Promise<User> {
  const { data } = await apiClient.post<User>("/api/users", body);
  return data;
}

export async function updateUser(
  id: number,
  body: { displayName?: string; role?: UserRole; password?: string }
): Promise<User> {
  const { data } = await apiClient.put<User>(`/api/users/${id}`, body);
  return data;
}

export async function toggleUser(id: number) {
  const { data } = await apiClient.patch(`/api/users/${id}/toggle`);
  return data;
}
