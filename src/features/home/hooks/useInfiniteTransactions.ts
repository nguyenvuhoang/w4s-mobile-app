import StorageKey from "@/constants/StorageKey";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { transactionRepository } from "@/services/repositories/transaction.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { useCallback, useEffect, useState } from "react";
import { RecentTransaction } from "./useRecentTransactions";

interface UseInfiniteTransactionsReturn {
    transactions: RecentTransaction[];
    totalCount: number;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
}

/**
 * Hook for fetching transactions with infinite scroll/pagination
 * @param pageSize - Number of transactions per page
 */
export const useInfiniteTransactions = (
    pageSize: number = 10,
): UseInfiniteTransactionsReturn => {
    const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
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

            const userCode = await StorageService.getItem(StorageKey.userCode);
            if (!userCode) {
                throw new Error("Missing user code");
            }

            const response = await transactionRepository.getRecentTransactions({
                usercode: userCode,
                page_index: pageIndex,
                page_size: pageSize,
            });

            if (response.isSuccess() && response.data) {
                const transactionList = response.data.recent_transactions || [];
                const total = response.data.total_count || 0;

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
            console.error("Error fetching transactions:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [pageSize]);

    const refresh = useCallback(async () => {
        await fetchTransactions(0, false);
    }, [fetchTransactions]);

    const loadMore = useCallback(async () => {
        if (loadingMore || loading) return;
        
        const nextPage = currentPage + 1;
        const hasMore = transactions.length < totalCount;
        
        if (hasMore) {
            await fetchTransactions(nextPage, true);
        }
    }, [currentPage, transactions.length, totalCount, loadingMore, loading, fetchTransactions]);

    useEffect(() => {
        fetchTransactions(0, false);
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
        loading,
        loadingMore,
        error,
        hasMore,
        refresh,
        loadMore,
    };
};
