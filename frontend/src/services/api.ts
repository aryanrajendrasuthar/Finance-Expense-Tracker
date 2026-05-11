import axios from 'axios';
import type {
  User, Category, Transaction, Budget,
  OverviewStats, MonthlyStats, CategoryStats,
  TransactionsResponse, TransactionFilters,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  me: () => api.get<{ user: User }>('/auth/me'),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Transactions
export const transactionsApi = {
  getAll: (filters: TransactionFilters = {}) =>
    api.get<TransactionsResponse>('/transactions', { params: filters }),
  create: (data: Partial<Transaction>) =>
    api.post<{ transaction: Transaction; budgetAlert: null | object }>('/transactions', data),
  update: (id: string, data: Partial<Transaction>) =>
    api.put<{ transaction: Transaction; budgetAlert: null | object }>(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  exportCsv: () =>
    api.get('/transactions/export', { responseType: 'blob' }),
  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ imported: number; skipped: number; errors: string[] }>(
      '/transactions/import', form, { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};

// Budgets
export const budgetsApi = {
  getAll: (month?: string) => api.get<Budget[]>('/budgets', { params: { month } }),
  create: (data: { categoryId: string; limit: number; month: string }) =>
    api.post<Budget>('/budgets', data),
  update: (id: string, data: { limit?: number; month?: string }) =>
    api.put<Budget>(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

// Stats
export const statsApi = {
  overview: () => api.get<OverviewStats>('/stats/overview'),
  monthly: (year?: number) => api.get<MonthlyStats[]>('/stats/monthly', { params: { year } }),
  categories: (month?: string, type?: string) =>
    api.get<CategoryStats[]>('/stats/categories', { params: { month, type } }),
};

export default api;
