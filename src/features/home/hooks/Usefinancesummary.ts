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

      const response = await financeSummaryRepository.getIncomeExpenseSummary({
        period_type: "M",
        usercode: userCode,
      });

      if (response.isSuccess() && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch finance summary");
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while fetching finance summary",
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

