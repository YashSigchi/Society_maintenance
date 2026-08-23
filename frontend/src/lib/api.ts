import axios from 'axios';

// Empty base URL uses the Vite dev-server proxy (/api → backend).
// Set VITE_API_URL only when the frontend is not served with that proxy.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function unwrapList<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export function getErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as {
    response?: { data?: { message?: string; errors?: { message?: string }[] } };
    message?: string;
  };

  if (!axiosErr.response) {
    return 'Cannot reach the server. Make sure the backend is running.';
  }

  const fieldError = axiosErr.response.data?.errors?.[0]?.message;
  return axiosErr.response.data?.message || fieldError || fallback;
}
