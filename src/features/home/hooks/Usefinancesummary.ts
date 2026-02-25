import StorageKey from "@/constants/StorageKey";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { financeSummaryRepository } from "@/services/repositories/financeSummary.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { useCallback, useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
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

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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

  const fetchBalance = useCallback(
    async (params: {
        period_type: string,
        anchor_date: string,
        type: string,
        wallet_id?: number
    }) => {
      setLoading(true);
      setError(null);
      try {
        const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
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
  const defaultAnchor = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
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
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
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

      const mapItems = (res: any): ChartDataPoint[] => {
        const items: any[] = res?.data?.items ?? res?.data ?? [];
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => ({
          value: Number(item.amount ?? item.total ?? item.value ?? 0),
          label: String(item.day ?? item.date ?? item.label ?? ""),
        }));
      };

      if (expenseRes.isSuccess()) {
        setExpenses(mapItems(expenseRes));
      } else {
        console.warn("[useMonthlyChartData] expense API error:", expenseRes.message);
      }

      if (incomeRes.isSuccess()) {
        setIncomes(mapItems(incomeRes));
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

  return {
    expenses,
    incomes,
    loading,
    error,
    anchorDate,
    refresh: fetchChartData,
  };
};

