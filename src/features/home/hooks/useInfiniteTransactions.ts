import StorageKey from "@/constants/StorageKey";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { transactionRepository } from "@/services/repositories/transaction.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { useCallback, useEffect, useState } from "react";
import { RecentTransaction } from "./useRecentTransactions";
import { categoryCache } from "@/features/category/hooks/useCategorycache";

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
 * @param walletId - Optional wallet ID to filter by
 */
export const useInfiniteTransactions = (
    pageSize: number = 10,
    walletId?: number,
    searchQuery?: string,
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

            let response;
            if (searchQuery) {
                response = await transactionRepository.simpleSearchTransactions({
                    search_text: searchQuery,
                    page_index: pageIndex + 1,
                    page_size: pageSize,
                });
            } else if (walletId) {
                // If walletId is provided, use advanced search
                response = await transactionRepository.advancedSearchTransactions({
                    wallet_id: walletId,
                    page_index: pageIndex + 1,
                    page_size: pageSize,
                });
            } else {
                response = await transactionRepository.getRecentTransactions({
                    usercode: userCode,
                    page_index: pageIndex,
                    page_size: pageSize,
                });
            }

            if (response.isSuccess() && response.data) {
                let transactionList: RecentTransaction[] = [];
                let total = 0;

                if (walletId || searchQuery) {
                    // Map advanced search response structure
                    const anyData = response.data as any;
                    if (Array.isArray(anyData)) {
                        transactionList = anyData;
                        total = anyData.length; // Might not have total count in array form
                    } else if (anyData.items && Array.isArray(anyData.items)) {
                        transactionList = anyData.items;
                        total = anyData.total_count || anyData.total || transactionList.length;
                    } else if (anyData.data && Array.isArray(anyData.data)) {
                        transactionList = anyData.data;
                        total = anyData.total_count || anyData.total || transactionList.length;
                    }
                    
                    // Normalize the transaction structure if needed (ensure it matches RecentTransaction)
                    transactionList = transactionList.map((tx: any) => {
                        // Get category info from cache
                        const category = categoryCache.getById(tx.category_id);

                        // Determine type: Prioritize API -> Cache -> Fallbacks
                        let type = tx.type;
                        if (!type && category) type = category.category_group;
                        if (!type) {
                            if (tx.name === "Expense" || tx.name === "Chi phí") type = "EXPENSE";
                            else if (tx.name === "Income" || tx.name === "Thu nhập") type = "INCOME";
                            else type = "EXPENSE"; 
                        }

                        // Map fields: Prioritize cache for visual correctness
                        return {
                            transaction_id: tx.transaction_id || tx.id,
                            type: type === "01" || type === "INCOME" ? "INCOME" : (type === "02" || type === "EXPENSE" ? "EXPENSE" : "LOAN"),
                            category_id: tx.category_id,
                            category_name: category?.category_name || tx.category_name,
                            title: tx.description || tx.transaction_description || tx.title || tx.name,
                            amount: tx.amount,
                            currency: tx.currency || "VND",
                            occurred_at: tx.occurred_at || tx.recorded_at || tx.transaction_date,
                            icon: category?.icon || tx.icon,
                            color: category?.color || tx.color,
                            description: tx.description || tx.transaction_description,
                        };
                    });


                } else {
                    const rawList = response.data.recent_transactions || [];
                    transactionList = rawList.map((tx: any) => {
                        const category = categoryCache.getById(tx.category_id);
                        return {
                            ...tx,
                            category_name: category?.category_name || tx.category_name,
                            icon: category?.icon || tx.icon,
                            color: category?.color || tx.color,
                        };
                    });
                    total = response.data.total_count || 0;
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
            console.error("Error fetching transactions:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [pageSize, walletId, searchQuery]);

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

