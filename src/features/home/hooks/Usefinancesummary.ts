import StorageKey from "@/constants/StorageKey";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { financeSummaryRepository } from "@/services/repositories/financeSummary.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

interface ExpenseSummary {
  total: number;
  formatted_total: string;
  change_percent: number;
}

interface IncomeSummary {
  total: number;
  formatted_total: string;
  change_percent: number;
}

interface IncomeExpenseSummary {
  expense: ExpenseSummary;
  income: IncomeSummary;
}

interface FinanceSummaryData {
  income_expense_summary: IncomeExpenseSummary;
  total_balance?: number;
}

interface UseFinanceSummaryReturn {
  data: FinanceSummaryData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching income and expense summary
 * Automatically refetches when currency or transaction changes
 */
export const useFinanceSummary = (): UseFinanceSummaryReturn => {
  const [data, setData] = useState<FinanceSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userCode = await StorageService.getItem(StorageKey.userCode);
      if (!userCode) {
        throw new Error("Missing user code");
      }

      const [summaryResponse, balanceResponse] = await Promise.all([
        financeSummaryRepository.getIncomeExpenseSummary({
          period_type: "M",
          usercode: userCode,
        }),
        financeSummaryRepository.getTotalBalance(userCode),
      ]);

      if (summaryResponse.isSuccess() && summaryResponse.data) {
        let totalBalance = 0;
        if (balanceResponse.isSuccess() && balanceResponse.data) {
          const balanceData = balanceResponse.data;
          if (typeof balanceData === "number") {
            totalBalance = balanceData;
          } else if (typeof balanceData === "object") {
            const tb = balanceData.total_balance;
            if (typeof tb === "number") {
              totalBalance = tb;
            } else if (typeof tb === "object" && tb !== null) {
              totalBalance = tb.total_balance ?? 0;
            }
          }
        }

        setData({
          ...summaryResponse.data,
          total_balance: totalBalance,
        });
      } else {
        setError(summaryResponse.message || "Failed to fetch finance summary");
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while fetching finance summary"
      );
      console.error("Error fetching finance summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Dùng useFocusEffect thay useEffect để fetch lại mỗi khi màn hình được focus
  // Giải quyết race condition khi app mới khởi động (token chưa sẵn sàng)
  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [fetchSummary])
  );

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChanged = () => {
      fetchSummary();
    };

    CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);

    return () => {
      CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
    };
  }, [fetchSummary]);

  // Listen for transaction changes (create/update/delete)
  useEffect(() => {
    const handleTransactionChanged = () => {
      fetchSummary();
    };

    TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);

    return () => {
      TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
    };
  }, [fetchSummary]);

  return {
    data,
    loading,
    error,
    refresh: fetchSummary,
  };
};

/**
 * Hook for fetching wallet-specific income and expense summary
 */
export const useWalletIncomeExpenseSummary = () => {
  const [data, setData] = useState<IncomeExpenseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastParams = useRef<{
    wallet_id?: number;
    anchor_date?: string;
    period_type: string;
  } | null>(null);

  const fetchWalletSummary = useCallback(
    async (params: {
      wallet_id?: number;
      anchor_date?: string;
      period_type: string;
    }) => {
      lastParams.current = params;
      try {
        setLoading(true);
        setError(null);

        const userCode = await StorageService.getItem(StorageKey.userCode);
        if (!userCode) {
          throw new Error("Missing user code");
        }

        const response = await financeSummaryRepository.getIncomeExpenseSummary({
          usercode: userCode,
          period_type: params.period_type as any,
          wallet_id: params.wallet_id,
          anchor_date: params.anchor_date,
        });

        if (response.isSuccess() && response.data) {
          setData(response.data.income_expense_summary);
          return response.data.income_expense_summary;
        } else {
          setError(response.message || "Failed to fetch wallet summary");
        }
      } catch (err: any) {
        setError(
          err.message || "An error occurred while fetching wallet summary"
        );
        console.error("Error fetching wallet summary:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handleTransactionChanged = () => {
      if (lastParams.current) {
        fetchWalletSummary(lastParams.current);
      }
    };

    TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);
    CurrencyEventEmitter.onCurrencyChanged(handleTransactionChanged);

    return () => {
      TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
      CurrencyEventEmitter.offCurrencyChanged(handleTransactionChanged);
    };
  }, [fetchWalletSummary]);

  return {
    data,
    loading,
    error,
    fetchWalletSummary,
  };
};


export interface BalanceDetail {
    label: string;
    amount: number;
}

export interface NetBalance {
    total: number;
    details: BalanceDetail[];
}

export interface WalletOpeningClosingBalanceData {
    net_balance?: NetBalance;
    opening_balance?: number;
    closing_balance?: number;
    income_amount?: number;
    expense_amount?: number;
}

export const useWalletOpeningClosingBalance = () => {
  const [data, setData] = useState<WalletOpeningClosingBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Store last params for refresh
  const lastParams = useRef<{
    period_type: string,
    anchor_date: string,
    type: string,
    wallet_id?: number
  } | null>(null);

  const fetchBalance = useCallback(
    async (params: {
        period_type: string,
        anchor_date: string,
        type: string,
        wallet_id?: number
    }) => {
      lastParams.current = params;
      setLoading(true);
      setError(null);
      try {
        const userCode = await StorageService.getItem(StorageKey.userCode);
        if (!userCode) {
            throw new Error("Missing user code");
        }

        const response =
          await financeSummaryRepository.getWalletOpeningClosingBalance({
            usercode: userCode,
            ...params
          });

        if (response.isSuccess() && response.data) {
          setData(response.data);
          return response.data;
        } else {
          setError(
            response.message || "Failed to fetch wallet opening closing balance"
          );
        }
      } catch (err: any) {
        setError(
          err.message ||
            "An error occurred while fetching wallet opening closing balance"
        );
        console.error("Error fetching wallet opening closing balance:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handleTransactionChanged = () => {
      if (lastParams.current) {
        fetchBalance(lastParams.current);
      }
    };

    TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);
    CurrencyEventEmitter.onCurrencyChanged(handleTransactionChanged);

    return () => {
      TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
      CurrencyEventEmitter.offCurrencyChanged(handleTransactionChanged);
    };
  }, [fetchBalance]);

  return {
    data,
    loading,
    error,
    fetchBalance,
  };
};

export interface ChartDataPoint {
  value: number;
  label: string;
}

export interface MonthlyChartData {
  expenses: ChartDataPoint[];
  incomes: ChartDataPoint[];
  month: number;
  year: number;
}

export const useMonthlyChartData = (params?: {
  anchor_date?: string;
  walletId?: number;
}) => {
  const now = new Date();
  const defaultAnchor = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const anchorDate = params?.anchor_date ?? defaultAnchor;
  const walletId   = params?.walletId;

  const [expenses, setExpenses] = useState<ChartDataPoint[]>([]);
  const [incomes,  setIncomes]  = useState<ChartDataPoint[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userCode = await StorageService.getItem(StorageKey.userCode);
      if (!userCode) throw new Error("Missing user code");

      const [expenseRes, incomeRes] = await Promise.all([
        financeSummaryRepository.getMonthlyExpense({
          usercode: userCode,
          anchor_date: anchorDate,
          wallet_id: walletId,
        }),
        financeSummaryRepository.getMonthlyIncome({
          usercode: userCode,
          anchor_date: anchorDate,
          wallet_id: walletId,
        }),
      ]);

      const mapItems = (items: any[]): ChartDataPoint[] => {
        if (!Array.isArray(items)) return [];
        const points = items.map((item: any) => ({
          value: Number(item.value ?? item.amount ?? item.total ?? 0),
          label: String(item.label ?? item.day ?? item.date ?? ""),
        }));
        // Tính lũy tiến: ngày N = tổng từ ngày 1 đến ngày N
        let cumulative = 0;
        return points.map((p) => {
          cumulative += p.value;
          return { ...p, value: cumulative };
        });
      };

      if (expenseRes.isSuccess()) {
        const raw = expenseRes?.data?.monthly_expense?.data ?? [];
        setExpenses(mapItems(raw));
      } else {
        console.warn("[useMonthlyChartData] expense API error:", expenseRes.message);
      }

      if (incomeRes.isSuccess()) {
        const raw = incomeRes?.data?.monthly_income?.data ?? [];
        setIncomes(mapItems(raw));
      } else {
        console.warn("[useMonthlyChartData] income API error:", incomeRes.message);
      }
    } catch (err: any) {
      const msg = err?.message ?? "Error fetching monthly chart data";
      setError(msg);
      console.error("[useMonthlyChartData]", err);
    } finally {
      setLoading(false);
    }
  }, [anchorDate, walletId]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChanged = () => {
      fetchChartData();
    };
    CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);
    return () => {
      CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
    };
  }, [fetchChartData]);

  // Listen for transaction changes (create/update/delete)
  useEffect(() => {
    const handleTransactionChanged = () => {
      fetchChartData();
    };

    TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);

    return () => {
      TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
    };
  }, [fetchChartData]);

  return {
    expenses,
    incomes,
    loading,
    error,
    anchorDate,
    refresh: fetchChartData,
  };
};

