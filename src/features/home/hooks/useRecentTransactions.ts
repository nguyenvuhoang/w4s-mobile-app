import StorageKey from "@/constants/StorageKey";
import { useLazyRefreshOnEvents } from "@/hooks/useLazyRefreshOnEvents";
import { transactionRepository } from "@/services/repositories/transaction.repository";
import StorageService from "@/services/StorageService";
import { useCallback, useEffect, useState } from "react";

export interface RecentTransaction {
    transaction_id: string;
    type: string; // "INCOME", "EXPENSE", "LOAN"
    category_id: number;
    category_name: string;
    title: string;
    amount: number;
    currency: string;
    occurred_at: string;
    icon: string;
    color: string;
    description?: string;
}

interface UseRecentTransactionsReturn {
    transactions: RecentTransaction[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const RECENT_TX_TTL_MS = 30_000;
const recentTransactionsCache = new Map<
    string,
    { transactions: RecentTransaction[]; totalCount: number; timestamp: number }
>();
const recentTransactionsInFlight = new Map<
    string,
    Promise<{ transactions: RecentTransaction[]; totalCount: number } | null>
>();
let lastRecentTxUserCode = "";

/**
 * Hook for fetching recent transactions
 * Automatically refetches when a transaction is created/updated/deleted
 * @param pageSize - Number of transactions per page (0 = all transactions)
 */
export const useRecentTransactions = (
    pageSize: number = 5,
): UseRecentTransactionsReturn => {
    const initialCached = lastRecentTxUserCode
        ? recentTransactionsCache.get(`${lastRecentTxUserCode}_${pageSize}`)
        : undefined;
    const isInitialFresh = initialCached
        ? Date.now() - initialCached.timestamp < RECENT_TX_TTL_MS
        : false;

    const [transactions, setTransactions] = useState<RecentTransaction[]>(
        isInitialFresh && initialCached ? initialCached.transactions : []
    );
    const [totalCount, setTotalCount] = useState(
        isInitialFresh && initialCached ? initialCached.totalCount : 0
    );
    const [loading, setLoading] = useState(!(isInitialFresh && initialCached));
    const [error, setError] = useState<string | null>(null);

    const fetchRecentTransactions = useCallback(async (force = false) => {
        try {
            const userCode = await StorageService.getItem(StorageKey.userCode);
            if (!userCode) {
                throw new Error("Missing user code");
            }
            lastRecentTxUserCode = userCode;
            const cacheKey = `${userCode}_${pageSize}`;

            const cached = recentTransactionsCache.get(cacheKey);
            if (!force && cached && Date.now() - cached.timestamp < RECENT_TX_TTL_MS) {
                setTransactions(cached.transactions);
                setTotalCount(cached.totalCount);
                setError(null);
                setLoading(false);
                return;
            }

            if (!cached) {
                setLoading(true);
            }
            setError(null);

            let requestPromise = !force ? recentTransactionsInFlight.get(cacheKey) : undefined;
            if (!requestPromise) {
                requestPromise = (async () => {
                    try {
                        const response = await transactionRepository.getRecentTransactions({
                            usercode: userCode,
                            page_index: 0,
                            page_size: pageSize,
                        });

                        if (response.isSuccess() && response.data) {
                            const transactionList = response.data.recent_transactions || [];
                            const total = response.data.total_count || 0;
                            recentTransactionsCache.set(cacheKey, {
                                transactions: transactionList,
                                totalCount: total,
                                timestamp: Date.now(),
                            });
                            return { transactions: transactionList, totalCount: total };
                        } else {
                            setError(response.message || "Failed to fetch recent transactions");
                            return null;
                        }
                    } finally {
                        recentTransactionsInFlight.delete(cacheKey);
                    }
                })();
                recentTransactionsInFlight.set(cacheKey, requestPromise);
            }

            const result = await requestPromise;
            if (result) {
                setTransactions(result.transactions);
                setTotalCount(result.totalCount);
            }
        } catch (err: any) {
            setError(
                err.message || "An error occurred while fetching recent transactions",
            );
            console.error("Error fetching recent transactions:", err);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchRecentTransactions(false);
    }, [fetchRecentTransactions]);

    // Mark-dirty & lazy refetch on focus when transaction or currency changes
    useLazyRefreshOnEvents(() => fetchRecentTransactions(false), {
        onInvalidate: () => {
            recentTransactionsCache.clear();
            recentTransactionsInFlight.clear();
        },
    });

    const refresh = useCallback(() => fetchRecentTransactions(true), [fetchRecentTransactions]);

    return {
        transactions,
        totalCount,
        loading,
        error,
        refresh,
    };
};
