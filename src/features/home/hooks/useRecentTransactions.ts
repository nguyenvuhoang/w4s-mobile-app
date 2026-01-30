import StorageKey from "@/constants/StorageKey";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { transactionRepository } from "@/services/repositories/transaction.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { useCallback, useEffect, useState } from "react";

export interface RecentTransaction {
    transaction_id: string;
    type: string; // "INCOME", "EXPENSE", "LOAN"
    category: number;
    title: string;
    amount: number;
    currency: string;
    occurred_at: string;
    icon: string;
    color: string;
}

interface UseRecentTransactionsReturn {
    transactions: RecentTransaction[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook for fetching recent transactions
 * Automatically refetches when a transaction is created/updated/deleted
 */
export const useRecentTransactions = (
    take: number = 5,
): UseRecentTransactionsReturn => {
    const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecentTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
            if (!userCode) {
                throw new Error("Missing user code");
            }

            const response = await transactionRepository.getRecentTransactions({
                usercode: userCode,
                take,
            });

            if (response.isSuccess() && response.data) {
                // API returns { recent_transactions: [...] }
                const transactionList = Array.isArray(response.data)
                    ? response.data
                    : response.data.recent_transactions || [];
                setTransactions(transactionList);
            } else {
                setError(response.message || "Failed to fetch recent transactions");
            }
        } catch (err: any) {
            setError(
                err.message || "An error occurred while fetching recent transactions",
            );
            console.error("Error fetching recent transactions:", err);
        } finally {
            setLoading(false);
        }
    }, [take]);

    useEffect(() => {
        fetchRecentTransactions();
    }, [fetchRecentTransactions]);

    // Listen for transaction changes (create/update/delete)
    useEffect(() => {
        const handleTransactionChanged = () => {
            fetchRecentTransactions();
        };

        const handleCurrencyChanged = () => {
            fetchRecentTransactions();
        };

        TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);
        CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);

        return () => {
            TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
            CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
        };
    }, [fetchRecentTransactions]);

    return {
        transactions,
        loading,
        error,
        refresh: fetchRecentTransactions,
    };
};
