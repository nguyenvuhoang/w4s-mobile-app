import StorageKey from "@/constants/StorageKey";
import { RecentTransaction } from "@/features/home/hooks/useRecentTransactions";
import { useCategory } from "@/hooks/useCategory";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { transactionRepository } from "@/services/repositories/transaction.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    const { categories } = useCategory();
    const [rawTransactions, setRawTransactions] = useState<RecentTransaction[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [noMoreData, setNoMoreData] = useState(false);

    /**
     * Memoized transactions with category information enriched.
     * This ensures that when categories load, the transactions list updates
     * automatically without needing a re-fetch.
     */
    const enrichedTransactions = useMemo(() => {
        return rawTransactions.map((t) => {
            const category = categories.find((c) => c.id === t.category_id);
            if (category) {
                return {
                    ...t,
                    category_name: category.category_name,
                    icon: category.icon,
                    color: category.color,
                };
            }
            return t;
        });
    }, [rawTransactions, categories]);

    const fetchTransactions = useCallback(async (pageIndex: number, append: boolean = false) => {
        try {
            if (!append) {
                setLoading(true);
                setNoMoreData(false);
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
                const transactionList = response.data.items || response.data.transactions || [];
                const total = response.data.total_count || 0;
                
                // If we are loading more but get 0 items, mark that we have no more data to prevent infinite loops
                if (append && transactionList.length === 0) {
                    setNoMoreData(true);
                    return;
                }

                // Map API item to RecentTransaction interface
                const mappedTransactions: RecentTransaction[] = transactionList.map((item: any) => {
                    const amount = Number(item.amount || 0);
                    const rawType = String(item.type || item.transaction_type || "").toUpperCase();
                    
                    // Determine type: INCOME, EXPENSE, or LOAN
                    let type = "EXPENSE";
                    if (rawType === "INCOME" || rawType === "01") {
                        type = "INCOME";
                    } else if (rawType === "LOAN" || rawType === "03") {
                        type = "LOAN";
                    } else if (rawType === "EXPENSE" || rawType === "02") {
                        type = "EXPENSE";
                    } else {
                        // Guess based on amount or name if type is missing
                        const name = (item.name || item.title || "").toLowerCase();
                        if (amount < 0) type = "EXPENSE";
                        else if (name.includes("expense") || name.includes("chi tiêu")) type = "EXPENSE";
                        else if (name.includes("income") || name.includes("thu nhập")) type = "INCOME";
                    }

                    return {
                        transaction_id: item.transaction_id || item.id?.toString() || "",
                        type,
                        category_id: item.category_id || 0,
                        category_name: item.category_name || "",
                        title: item.name || item.title || item.transaction_description || "Transaction",
                        amount: Math.abs(amount),
                        currency: item.currency || "",
                        occurred_at: item.transaction_date || item.occurred_at || item.recorded_at || new Date().toISOString(),
                        icon: item.icon || "",
                        color: item.color || "",
                        description: item.description || item.transaction_description || "",
                    };
                });

                // Summary data if available in response
                if (response.data.summary) {
                    setTotalIncome(response.data.summary.total_income || 0);
                    setTotalExpense(response.data.summary.total_expense || 0);
                } else {
                    // Fallback to manual calculation from current transactions list
                    let income = 0;
                    let expense = 0;
                    mappedTransactions.forEach((t: RecentTransaction) => {
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
                    setRawTransactions(prev => [...prev, ...mappedTransactions]);
                } else {
                    setRawTransactions(mappedTransactions);
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
        const hasMoreData = rawTransactions.length < totalCount;
        
        if (hasMoreData) {
            await fetchTransactions(nextPage, true);
        }
    }, [currentPage, rawTransactions.length, totalCount, loadingMore, loading, fetchTransactions]);

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

    const hasMore = !noMoreData && rawTransactions.length < totalCount;

    return {
        transactions: enrichedTransactions,
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
