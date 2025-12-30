// import { useApiService } from '@/services/useApiService';
import { useCallback, useEffect, useState } from 'react';
import { apiServiceMock } from '../apiServiceMock';
import type {
    Budget,
    BudgetFormData,
    DashboardData,
    Settings,
    StatisticsData,
    Transaction,
    TransactionFormData,
} from '../types';

// BaseResponse structure from your API
interface BaseResponse {
  code: string;
  success: boolean;
  message: string;
  data: any;
  execution_id: string;
  timestamp: string;
  errors: any[];
  metadata: any;
}

/**
 * Hook for fetching and managing home dashboard data
 */
export const useHomeData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
//   apiServiceMoconst apiService = useApiService();ck

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiServiceMock.get<{ data: BaseResponse }>('/dashboard');
      const baseResponse = response.data;
      
      if (baseResponse.success) {
        setData(baseResponse.data);
      } else {
        setError(baseResponse.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refresh: fetchDashboard,
  };
};

/**
 * Hook for managing transactions
 */
export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
//   apiServiceMoconst apiService = useApiService();ck

  const fetchTransactions = useCallback(async (params?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    type?: 'expense' | 'income';
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.get<{ data: BaseResponse }>('/transactions', { params });
      const baseResponse = response.data;

      if (baseResponse.success) {
        setTransactions(baseResponse.data);
      } else {
        setError(baseResponse.message || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  const createTransaction = useCallback(async (data: TransactionFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.post<{ data: BaseResponse }>('/transactions', data);
      const baseResponse = response.data;

      if (baseResponse.success) {
        setTransactions((prev) => [baseResponse.data, ...prev]);
        return baseResponse.data;
      } else {
        setError(baseResponse.message || 'Failed to create transaction');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  const updateTransaction = useCallback(async (id: string, data: Partial<TransactionFormData>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.put<{ data: BaseResponse }>(`/transactions/${id}`, data);
      const baseResponse = response.data;

      if (baseResponse.success) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? baseResponse.data : t))
        );
        return baseResponse.data;
      } else {
        setError(baseResponse.message || 'Failed to update transaction');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.delete<{ data: BaseResponse }>(`/transactions/${id}`);
      const baseResponse = response.data;

      if (baseResponse.success) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        return true;
      } else {
        setError(baseResponse.message || 'Failed to delete transaction');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};

/**
 * Hook for managing budgets
 */
export const useBudget = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
//   apiServiceMoconst apiService = useApiService();ck

  const fetchBudgets = useCallback(async (period?: 'week' | 'month' | 'year') => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.get<{ data: BaseResponse }>('/budgets', {
        params: { period },
      });
      const baseResponse = response.data;

      if (baseResponse.success) {
        setBudgets(baseResponse.data);
      } else {
        setError(baseResponse.message || 'Failed to fetch budgets');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  const createBudget = useCallback(async (data: BudgetFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.post<{ data: BaseResponse }>('/budgets', data);
      const baseResponse = response.data;

      if (baseResponse.success) {
        setBudgets((prev) => [...prev, baseResponse.data]);
        return baseResponse.data;
      } else {
        setError(baseResponse.message || 'Failed to create budget');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  const updateBudget = useCallback(async (id: string, data: Partial<BudgetFormData>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.put<{ data: BaseResponse }>(`/budgets/${id}`, data);
      const baseResponse = response.data;

      if (baseResponse.success) {
        setBudgets((prev) => prev.map((b) => (b.id === id ? baseResponse.data : b)));
        return baseResponse.data;
      } else {
        setError(baseResponse.message || 'Failed to update budget');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.delete<{ data: BaseResponse }>(`/budgets/${id}`);
      const baseResponse = response.data;

      if (baseResponse.success) {
        setBudgets((prev) => prev.filter((b) => b.id !== id));
        return true;
      } else {
        setError(baseResponse.message || 'Failed to delete budget');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  };
};

/**
 * Hook for fetching statistics data
 */
export const useStatistics = () => {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
//   const apiService = useApiService();

  const fetchStatistics = useCallback(async (params: {
    period: 'day' | 'week' | 'month' | 'year';
    type: 'expense' | 'income';
    startDate?: Date;
    endDate?: Date;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.get<{ data: BaseResponse }>('/statistics', { params });
      const baseResponse = response.data;

      if (baseResponse.success) {
        setData(baseResponse.data);
      } else {
        setError(baseResponse.message || 'Failed to fetch statistics');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  return {
    data,
    loading,
    error,
    fetchStatistics,
  };
};

/**
 * Hook for managing settings
 */
export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
//   apiServiceMoconst apiService = useApiService();ck

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.get<{ data: BaseResponse }>('/settings');
      const baseResponse = response.data;

      if (baseResponse.success) {
        setSettings(baseResponse.data);
      } else {
        setError(baseResponse.message || 'Failed to fetch settings');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  const updateSettings = useCallback(async (data: Partial<Settings>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiServiceMock.put<{ data: BaseResponse }>('/settings', data);
      const baseResponse = response.data;

      if (baseResponse.success) {
        setSettings(baseResponse.data);
        return baseResponse.data;
      } else {
        setError(baseResponse.message || 'Failed to update settings');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiServiceMock]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: fetchSettings,
  };
};