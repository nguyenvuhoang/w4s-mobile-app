import { useState, useCallback, useEffect } from "react";
import { useTransaction } from "@/features/transaction/hooks/useTransaction";

export const useBudgetTransactions = (budgetId: number, walletId?: number, fromDate?: string, toDate?: string) => {
  const { advancedSearchTransactions, loading: apiLoading } = useTransaction();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const PAGE_SIZE = 20;

  const fetchTransactions = useCallback(
    async (page: number, isRefresh: boolean = false) => {
      try {
        if (isRefresh) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const result = await advancedSearchTransactions({
          wallet_budget_id: budgetId,
          wallet_id: walletId,
          from_transaction_date: fromDate,
          to_transaction_date: toDate,
          page_index: page,
          page_size: PAGE_SIZE,
        });

        const newItems = Array.isArray(result) ? result : (result?.items ?? []);
        
        let income = 0;
        let expense = 0;
        newItems.forEach((t: any) => {
          const amount = Number(t.amount || 0);
          const isExpense = amount < 0 || t.type === "02" || t.name === "Expense" || t.transaction_type === "EXPENSE";
          if (isExpense) expense += Math.abs(amount);
          else income += amount;
        });

        if (isRefresh) {
          setTransactions(newItems);
          setTotalIncome(income);
          setTotalExpense(expense);
        } else {
          setTransactions((prev) => [...prev, ...newItems]);
          setTotalIncome((prev) => prev + income);
          setTotalExpense((prev) => prev + expense);
        }

        setHasMore(newItems.length === PAGE_SIZE);
      } catch (error) {
        console.error("[useBudgetTransactions] Error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [budgetId, walletId, fromDate, toDate, advancedSearchTransactions]
  );

  const refresh = useCallback(() => {
    setPageIndex(1);
    return fetchTransactions(1, true);
  }, [fetchTransactions]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = pageIndex + 1;
      setPageIndex(nextPage);
      fetchTransactions(nextPage, false);
    }
  }, [loading, loadingMore, hasMore, pageIndex, fetchTransactions]);

  useEffect(() => {
    refresh();
  }, [budgetId]);

  return {
    transactions,
    loading,
    loadingMore,
    hasMore,
    totalIncome,
    totalExpense,
    refresh,
    loadMore,
  };
};
