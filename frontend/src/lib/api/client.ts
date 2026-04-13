import axios from 'axios';
import toast from 'react-hot-toast';
import { addToSyncQueue } from '@/lib/offline/offlineDb';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const statusMessages: Record<number, string> = {
  400: 'بيانات غير صالحة',
  401: 'انتهت الجلسة، يرجى تسجيل الدخول',
  403: 'ليس لديك صلاحية',
  404: 'العنصر غير موجود',
  429: 'تم تجاوز الحد المسموح، انتظر قليلا',
  500: 'خطأ في الخادم، يرجى المحاولة لاحقا',
  502: 'خطأ في الخادم، يرجى المحاولة لاحقا',
  503: 'الخدمة غير متاحة حاليا',
  504: 'انتهت مهلة الطلب، يرجى المحاولة لاحقا',
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token and request ID
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Attach a unique request ID for tracing across frontend/backend
  config.headers['X-Request-Id'] = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return config;
});

// Response interceptor - handle errors + offline queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: { response?: { status: number; data?: { errors?: string[] } }; config?: { method?: string; url?: string; data?: string }; message?: string }) => {
    // Network error (offline) -- no response from server
    if (!error.response && error.config) {
      const method = (error.config.method || '').toUpperCase();

      // Queue mutations for later sync
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        try {
          await addToSyncQueue({
            type: 'invoice',
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

      toast.error('لا يوجد اتصال بالإنترنت');
      return Promise.reject({
        ...error,
        isOffline: true,
        message: 'لا يوجد اتصال بالإنترنت',
      });
    }

    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      toast.error(statusMessages[401]);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Show a toast for known error status codes
    if (status && statusMessages[status]) {
      // Use server-provided error message if available, otherwise use the generic Arabic message
      const serverMessage = error.response?.data?.errors?.[0];
      toast.error(serverMessage || statusMessages[status]);
    }

    return Promise.reject(error);
  }
);
