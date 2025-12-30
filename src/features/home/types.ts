// Types for Home Feature

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Balance {
  total: number;
  income: number;
  expense: number;
  month: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface Transaction {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  type: 'expense' | 'income';
  note?: string;
  date: Date;
  createdAt: Date;
}

export interface CategorySpending {
  categoryId: string;
  category: Category;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  spent: number;
  period: 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
}

export interface StatisticsPeriod {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
}

export interface DailyStatistic {
  date: Date;
  amount: number;
  type: 'expense' | 'income';
}

export interface MonthlyComparison {
  month: string;
  year: number;
  totalExpense: number;
  totalIncome: number;
  balance: number;
}

export interface DashboardData {
  balance: Balance;
  topCategories: CategorySpending[];
  recentTransactions: Transaction[];
}

export interface StatisticsData {
  period: StatisticsPeriod;
  total: number;
  change: number;
  changePercentage: number;
  dailyStats: DailyStatistic[];
  categoryBreakdown: CategorySpending[];
  monthlyComparison: MonthlyComparison[];
}

export interface BudgetData {
  budgets: Budget[];
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  budgetId: string;
  category: Category;
  message: string;
  type: 'warning' | 'danger' | 'info';
  percentage: number;
}

export interface Settings {
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
  currency: CurrencySettings;
  language: string;
}

export interface NotificationSettings {
  enabled: boolean;
  transactionAlerts: boolean;
  budgetAlerts: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  autoLock: boolean;
  autoLockTimeout: number; // in minutes
}

export interface AppearanceSettings {
  darkMode: boolean;
  colorScheme: 'auto' | 'light' | 'dark';
}

export interface CurrencySettings {
  code: string;
  symbol: string;
  name: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Form Types
export interface TransactionFormData {
  categoryId: string;
  amount: number;
  type: 'expense' | 'income';
  note?: string;
  date: Date;
}

export interface BudgetFormData {
  categoryId: string;
  amount: number;
  period: 'week' | 'month' | 'year';
  startDate: Date;
}

// Navigation Types
export type HomeStackParamList = {
  Home: undefined;
  Statistics: undefined;
  AddTransaction: {
    type?: 'expense' | 'income';
  };
  Budget: undefined;
  Settings: undefined;
  TransactionDetail: {
    transactionId: string;
  };
  BudgetDetail: {
    budgetId: string;
  };
  CategoryDetail: {
    categoryId: string;
  };
};