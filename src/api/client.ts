import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/config/env';

export const TOKEN_KEY = 'dd_auth_token';

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
});

// Attach the session JWT to every request.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise the backend's { success, error: { message } } envelope into a
// readable Error so screens can show err.message directly.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

// Most endpoints return { success, data }. Unwrap to data.
export function unwrap<T>(payload: { data: T }): T {
  return payload.data;
}

export async function setAuthToken(token: string | null) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getAuthToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
