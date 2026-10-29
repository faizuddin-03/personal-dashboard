import { api } from './client';
import type { Role } from './auth';

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role: Role;
}

export async function listUsers(): Promise<UserRow[]> {
  const { data } = await api.get<UserRow[]>('/users');
  return data;
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const { data } = await api.post<UserRow>('/users', input);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function updateUser(id: string, patch: Partial<Pick<UserRow, 'role' | 'name'>>): Promise<UserRow> {
  const { data } = await api.patch<UserRow>(`/users/${id}`, patch);
  return data;
}

export async function resetUserPassword(id: string, password: string): Promise<UserRow> {
  const { data } = await api.patch<UserRow>(`/users/${id}`, { password });
  return data;
}
