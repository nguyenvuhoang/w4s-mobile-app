import { financeSummaryRepository } from "@/services/repositories/financeSummary.repository";
import { useCallback, useEffect, useState } from "react";

interface ExpenseSummary {
  total: number;
  change_percent: number;
}

interface IncomeSummary {
  total: number;
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
 */
export const useFinanceSummary = (): UseFinanceSummaryReturn => {
  const [data, setData] = useState<FinanceSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await financeSummaryRepository.getIncomeExpenseSummary({
        period_type: "M",
        usercode: "6a2616b6-e6c2-48e1-8751-0f804fd78e09",
      });

      if (response.isSuccess() && response.data) {
        console.log("Finance summary data:", response.data);
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

  return {
    data,
    loading,
    error,
    refresh: fetchSummary,
  };
};
