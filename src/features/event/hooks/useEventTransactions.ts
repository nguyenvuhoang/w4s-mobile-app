import StorageKey from "@/constants/StorageKey";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { transactionRepository } from "@/services/repositories/transaction.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { useCallback, useEffect, useState } from "react";
import { RecentTransaction } from "@/features/home/hooks/useRecentTransactions";

interface UseEventTransactionsReturn {
    transactions: RecentTransaction[];
    totalCount: number;
    totalIncome: number;
    totalExpense: number;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
}

/**
 * Hook for fetching transactions for a specific event with infinite scroll/pagination
 * @param eventId - The ID of the event
 * @param pageSize - Number of transactions per page
 */
export const useEventTransactions = (
    eventId: number,
    pageSize: number = 20,
): UseEventTransactionsReturn => {
    const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async (pageIndex: number, append: boolean = false) => {
        try {
            if (!append) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);

            const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
            if (!userCode) {
                throw new Error("Missing user code");
            }

            const response = await transactionRepository.advancedSearchTransactions({
                event_id: eventId,
                page_index: pageIndex,
                page_size: pageSize,
            });

            if (response.isSuccess() && response.data) {
                const transactionList = response.data.transactions || [];
                const total = response.data.total_count || 0;
                
                // Summary data if available in response
                if (response.data.summary) {
                    setTotalIncome(response.data.summary.total_income || 0);
                    setTotalExpense(response.data.summary.total_expense || 0);
                } else {
                    // Fallback to manual calculation from current transactions list
                    let income = 0;
                    let expense = 0;
                    transactionList.forEach((t: RecentTransaction) => {
                        if (t.type === "INCOME") income += t.amount;
                        else if (t.type === "EXPENSE") expense += Math.abs(t.amount);
                    });
                    
                    if (!append) {
                        setTotalIncome(income);
                        setTotalExpense(expense);
                    } else {
                        setTotalIncome(prev => prev + income);
                        setTotalExpense(prev => prev + expense);
                    }
                }

                if (append) {
                    setTransactions(prev => [...prev, ...transactionList]);
                } else {
                    setTransactions(transactionList);
                }
                setTotalCount(total);
                setCurrentPage(pageIndex);
            } else {
                setError(response.message || "Failed to fetch transactions");
            }
        } catch (err: any) {
            setError(
                err.message || "An error occurred while fetching transactions",
            );
            console.error("Error fetching event transactions:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [eventId, pageSize]);

    const refresh = useCallback(async () => {
        await fetchTransactions(1, false);
    }, [fetchTransactions]);

    const loadMore = useCallback(async () => {
        if (loadingMore || loading) return;
        
        const nextPage = currentPage + 1;
        const hasMoreData = transactions.length < totalCount;
        
        if (hasMoreData) {
            await fetchTransactions(nextPage, true);
        }
    }, [currentPage, transactions.length, totalCount, loadingMore, loading, fetchTransactions]);

    useEffect(() => {
        fetchTransactions(1, false);
    }, [fetchTransactions]);

    // Listen for transaction changes (create/update/delete)
    useEffect(() => {
        const handleTransactionChanged = () => {
            refresh();
        };

        const handleCurrencyChanged = () => {
            refresh();
        };

        TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);
        CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);

        return () => {
            TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
            CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
        };
    }, [refresh]);

    const hasMore = transactions.length < totalCount;

    return {
        transactions,
        totalCount,
        totalIncome,
        totalExpense,
        loading,
        loadingMore,
        error,
        hasMore,
        refresh,
        loadMore,
    };
};
