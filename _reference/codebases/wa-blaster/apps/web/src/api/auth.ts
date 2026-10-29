import { api } from './client';

export type Role = 'ADMIN' | 'OPERATOR';

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function refreshAccessToken(): Promise<LoginResponse> {
  // The refresh_token cookie is sent automatically because the axios instance
  // has withCredentials: true. The server reads it and returns a new access token.
  const { data } = await api.post<LoginResponse>('/auth/refresh');
  return data;
}

export async function logoutOnServer(): Promise<void> {
  // Best-effort; we ignore errors so client-side cleanup proceeds regardless.
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  }
}
