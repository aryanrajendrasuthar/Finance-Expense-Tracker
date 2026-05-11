export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  userId: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  isRecurring: boolean;
  recurringInterval: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  category?: Category;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  limit: number;
  month: string;
  spent: number;
  percentage: number;
  alert: boolean;
  exceeded: boolean;
  category?: Category;
}

export interface BudgetAlert {
  categoryId: string;
  budgetLimit: number;
  spent: number;
  percentage: number;
  alert: boolean;
  exceeded: boolean;
}

export interface OverviewStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryStats {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  total: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense' | '';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'date' | 'amount' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';
