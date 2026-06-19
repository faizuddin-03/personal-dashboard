import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE ?? '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Marker we attach to AxiosRequestConfig to prevent infinite retry loops.
interface RetryableRequest extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequest | undefined;
    if (!original) throw error;
    // Don't retry the refresh endpoint itself, and don't retry if we already retried.
    const isRefreshCall = typeof original.url === 'string' && original.url.includes('/auth/refresh');
    if (error.response?.status !== 401 || original._retried || isRefreshCall) {
      throw error;
    }
    original._retried = true;

    // Share the refresh promise across concurrent 401s so we only refresh once.
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
          accessToken = data.accessToken;
          return data.accessToken;
        } catch (err) {
          // Refresh failed → user must log in again
          accessToken = null;
          throw err;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    try {
      const newToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api.request(original);
    } catch {
      throw error;
    }
  },
);
