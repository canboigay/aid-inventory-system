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
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },
};

// Quick Entry API (for dashboard)
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

export default apiClient;
