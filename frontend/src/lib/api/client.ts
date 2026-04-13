import axios from 'axios';
import { addToSyncQueue } from '@/lib/offline/offlineDb';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors + offline queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: { response?: { status: number }; config?: { method?: string; url?: string; data?: string }; message?: string }) => {
    // Network error (offline) — no response from server
    if (!error.response && error.config) {
      const method = (error.config.method || '').toUpperCase();

      // Queue mutations for later sync
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        try {
          await addToSyncQueue({
            type: 'invoice' as any,
            payload: {
              url: error.config.url,
              method,
              data: error.config.data ? JSON.parse(error.config.data) : undefined,
            },
            createdAt: new Date().toISOString(),
            status: 'pending',
            retries: 0,
          });
        } catch {
          // Silently fail queue attempt
        }
      }

      // For GET requests, return a rejected promise with offline flag
      // Callers can use getCachedProducts / getCachedCustomers directly
      return Promise.reject({
        ...error,
        isOffline: true,
        message: 'لا يوجد اتصال بالإنترنت',
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
