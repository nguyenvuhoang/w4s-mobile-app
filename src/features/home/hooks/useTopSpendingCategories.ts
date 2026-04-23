import StorageKey from "@/constants/StorageKey";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { categoryRepository } from "@/services/repositories/category.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { useCallback, useEffect, useState } from "react";

export interface TopSpendingCategory {
    category_id: number;
    name: string | null;
    icon: string;
    color: string;
    transaction_count: number;
    total_amount: number;
    percentage: number;
}

interface UseTopSpendingCategoriesReturn {
    categories: TopSpendingCategory[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook for fetching top spending categories
 * Automatically refetches when a transaction is created/updated/deleted
 */
export const useTopSpendingCategories = (
    periodType: string = "M",
    take: number = 5,
): UseTopSpendingCategoriesReturn => {
    const [categories, setCategories] = useState<TopSpendingCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTopCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const userCode = await StorageService.getItem(StorageKey.userCode);
            if (!userCode) {
                throw new Error("Missing user code");
            }

            const currentDate = new Date();
            const formattedAnchorDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

            const response = await categoryRepository.getTopSpendingCategories({
                anchor_date: formattedAnchorDate,
                page_index: 0,
                page_size: take,
                period_type: periodType,
                usercode: userCode,
            });
            console.log("response", JSON.stringify(response));

            if (response.isSuccess() && response.data) {
                let categoryList: TopSpendingCategory[] = [];
                if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    categoryList = response.data.data[0].top_categories || [];
                } else if (response.data.top_categories) {
                    categoryList = response.data.top_categories;
                } else if (Array.isArray(response.data)) {
                    categoryList = response.data;
                }
                setCategories(categoryList);
            } else {
                setError(response.message || "Failed to fetch top spending categories");
            }
        } catch (err: any) {
            setError(
                err.message || "An error occurred while fetching top spending categories",
            );
            console.error("Error fetching top spending categories:", err);
        } finally {
            setLoading(false);
        }
    }, [periodType, take]);

    useEffect(() => {
        fetchTopCategories();
    }, [fetchTopCategories]);

    // Listen for transaction changes (create/update/delete)
    useEffect(() => {
        const handleTransactionChanged = () => {
            fetchTopCategories();
        };

        const handleCurrencyChanged = () => {
            fetchTopCategories();
        };

        TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);
        CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);

        return () => {
            TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
            CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
        };
    }, [fetchTopCategories]);

    return {
        categories,
        loading,
        error,
        refresh: fetchTopCategories,
    };
};
