import axios from 'axios';
import type {
  LoginRequest,
  TokenResponse,
  User,
  Item,
  ItemCreate,
  QuickProductionEntry,
  QuickPurchaseEntry,
  QuickDistributionEntry,
  DashboardStats,
  Recipient,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  register: async (data: { username: string; email: string; full_name: string; password: string; role: string }): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  listUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/auth/users');
    return response.data;
  },

  updateUser: async (userId: string, data: { email?: string; full_name?: string; role?: string; is_active?: boolean }): Promise<User> => {
    const response = await apiClient.patch<User>(`/auth/users/${userId}`, data);
    return response.data;
  },

  adminResetPassword: async (userId: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/auth/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// Items API
export const itemsAPI = {
  list: async (): Promise<Item[]> => {
    const response = await apiClient.get<Item[]>('/items');
    return response.data;
  },

  create: async (data: ItemCreate): Promise<Item> => {
    const response = await apiClient.post<Item>('/items', data);
    return response.data;
  },

  get: async (id: string): Promise<Item> => {
    const response = await apiClient.get<Item>(`/items/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<ItemCreate>): Promise<Item> => {
    const response = await apiClient.patch<Item>(`/items/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },

  adjust: async (id: string, delta: number, reason?: string): Promise<Item> => {
    const response = await apiClient.post<Item>(`/items/${id}/adjust`, { delta, reason });
    return response.data;
  },
};

// Quick Entry API (for dashboard)
// Recipients API
export const recipientsAPI = {
  list: async (q?: string): Promise<Recipient[]> => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<Recipient[]>(`/recipients${suffix}`);
    return response.data;
  },
};

export const quickEntryAPI = {
  production: async (data: QuickProductionEntry): Promise<void> => {
    await apiClient.post('/quick/production', data);
  },

  purchase: async (data: QuickPurchaseEntry): Promise<void> => {
    await apiClient.post('/quick/purchase', data);
  },

  distribution: async (data: QuickDistributionEntry): Promise<void> => {
    await apiClient.post('/quick/distribution', data);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/quick/dashboard/stats');
    return response.data;
  },
};

// Reports API
import type { ComprehensiveReport } from '../types';

export const reportsAPI = {
  getActivityReport: async (period: 'day' | 'week' | 'month'): Promise<ComprehensiveReport> => {
    const response = await apiClient.get<ComprehensiveReport>(`/reports/activity?period=${period}`);
    return response.data;
  },
  getActivityReportCustom: async (startDate: string, endDate: string): Promise<ComprehensiveReport> => {
    const response = await apiClient.get<ComprehensiveReport>(
      `/reports/activity?start_date=${startDate}T00:00:00Z&end_date=${endDate}T23:59:59Z`
    );
    return response.data;
  },
};

export default apiClient;
