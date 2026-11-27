import StorageKey from "@/constants/StorageKey";
import { useLazyRefreshOnEvents } from "@/hooks/useLazyRefreshOnEvents";
import { categoryRepository } from "@/services/repositories/category.repository";
import StorageService from "@/services/StorageService";
import { PERIOD_TYPE } from "@/constants/PeriodType";
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

const TOP_CATEGORIES_TTL_MS = 30_000;
const topCategoriesCache = new Map<
    string,
    { categories: TopSpendingCategory[]; timestamp: number }
>();
const topCategoriesInFlight = new Map<
    string,
    Promise<TopSpendingCategory[] | null>
>();
let lastTopCatUserCode = "";

const getFormattedToday = () => {
    const currentDate = new Date();
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
};

/**
 * Hook for fetching top spending categories
 * Automatically refetches when a transaction is created/updated/deleted
 */
export const useTopSpendingCategories = (
    periodType: string = PERIOD_TYPE.MONTH,
    take: number = 5,
): UseTopSpendingCategoriesReturn => {
    const initialKey = lastTopCatUserCode
        ? `${lastTopCatUserCode}_${periodType}_${take}_${getFormattedToday()}`
        : "";
    const initialCached = initialKey ? topCategoriesCache.get(initialKey) : undefined;
    const isInitialFresh = initialCached
        ? Date.now() - initialCached.timestamp < TOP_CATEGORIES_TTL_MS
        : false;

    const [categories, setCategories] = useState<TopSpendingCategory[]>(
        isInitialFresh && initialCached ? initialCached.categories : []
    );
    const [loading, setLoading] = useState(!(isInitialFresh && initialCached));
    const [error, setError] = useState<string | null>(null);

    const fetchTopCategories = useCallback(async (force = false) => {
        try {
            const userCode = await StorageService.getItem(StorageKey.userCode);
            if (!userCode) {
                throw new Error("Missing user code");
            }
            lastTopCatUserCode = userCode;

            const formattedAnchorDate = getFormattedToday();
            const cacheKey = `${userCode}_${periodType}_${take}_${formattedAnchorDate}`;
            const cached = topCategoriesCache.get(cacheKey);
            if (!force && cached && Date.now() - cached.timestamp < TOP_CATEGORIES_TTL_MS) {
                setCategories(cached.categories);
                setError(null);
                setLoading(false);
                return;
            }

            if (!cached) {
                setLoading(true);
            }
            setError(null);

            let requestPromise = !force ? topCategoriesInFlight.get(cacheKey) : undefined;
            if (!requestPromise) {
                requestPromise = (async () => {
                    try {
                        const response = await categoryRepository.getTopSpendingCategories({
                            anchor_date: formattedAnchorDate,
                            page_index: 0,
                            page_size: take,
                            period_type: periodType,
                            usercode: userCode,
                        });

                        if (response.isSuccess() && response.data) {
                            let categoryList: TopSpendingCategory[] = [];
                            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                                categoryList = response.data.data[0].top_categories || [];
                            } else if (response.data.top_categories) {
                                categoryList = response.data.top_categories;
                            } else if (Array.isArray(response.data)) {
                                categoryList = response.data;
                            }
                            if (__DEV__) {
                                console.log("[useTopSpendingCategories] fetched:", categoryList.length);
                            }
                            topCategoriesCache.set(cacheKey, {
                                categories: categoryList,
                                timestamp: Date.now(),
                            });
                            return categoryList;
                        } else {
                            setError(response.message || "Failed to fetch top spending categories");
                            return null;
                        }
                    } finally {
                        topCategoriesInFlight.delete(cacheKey);
                    }
                })();
                topCategoriesInFlight.set(cacheKey, requestPromise);
            }

            const result = await requestPromise;
            if (result) {
                setCategories(result);
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
        fetchTopCategories(false);
    }, [fetchTopCategories]);

    // Mark-dirty & lazy refetch on focus when transaction or currency changes
    useLazyRefreshOnEvents(() => fetchTopCategories(false), {
        onInvalidate: () => {
            topCategoriesCache.clear();
            topCategoriesInFlight.clear();
        },
    });

    const refresh = useCallback(() => fetchTopCategories(true), [fetchTopCategories]);

    return {
        categories,
        loading,
        error,
        refresh,
    };
};
