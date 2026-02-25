import { AppConfig } from '@/config/AppConfig';
import StorageKey from '@/constants/StorageKey';
import { AnalyzeCategoryPayload, Category, categoryRepository, CreateCategoryPayload } from '@/services/repositories/category.repository';
import StorageService from '@/services/StorageService';
import { useCallback, useEffect, useState } from 'react';

interface UseCategoryOptions {
  autoFetch?: boolean;
  forceRefresh?: boolean;
}

interface CreateCategoryResult {
  success: boolean;
  message?: string;
}

export interface CategoryAnalyzeItem {
  id: number;
  category_code: string;
  wallet_id: number;
  parent_category_id: number;
  category_group: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_type: string;
  category_name: string;
  icon: string;
  color: string;
  total_amount: number;
  percentage: number;
}

export interface TopSpendingCategoryItem {
  id: number;
  category_code: string;
  wallet_id: number;
  parent_category_id: number;
  category_group: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_type: string;
  category_name: string;
  icon: string;
  color: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

/**
 * Hook lấy top danh mục chi tiêu tổng hợp tất cả ví (không cần wallet_id)
 * Dùng cho màn hình tổng quan (StatisticsScreen)
 */
export const useTopSpendingCategories = () => {
  const [data, setData] = useState<TopSpendingCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopCategories = useCallback(async (
    period_type: string = 'M',
    take: number = 5
  ) => {
    setLoading(true);
    setError(null);

    try {
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);

      const response = await categoryRepository.getTopSpendingCategories({
        usercode: userCode?.toString() || '',
        period_type,
        take,
      });

      if (response.isSuccess() && response.data) {
        // API có thể trả về dưới dạng mảng trực tiếp hoặc lồng trong key
        const list: TopSpendingCategoryItem[] =
          Array.isArray(response.data)
            ? response.data
            : response.data.data || response.data.categories || response.data.category_analyze || [];
        setData(list);
        return list;
      } else {
        throw new Error(response.message || 'Failed to fetch top spending categories');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch top spending categories';
      setError(msg);
      console.error('[useTopSpendingCategories] Error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchTopCategories };
};

let sessionCache: {
  categories: Category[];
  timestamp: number;
} | null = null;

// 🔥 Helper: Flatten nested categories
const flattenCategories = (categories: Category[]): Category[] => {
  const result: Category[] = [];

  categories.forEach(category => {
    // Add parent
    result.push(category);

    // Add children if exist
    if (category.children && category.children.length > 0) {
      result.push(...category.children);
    }
  });

  return result;
};

export const useCategory = (options: UseCategoryOptions = {}) => {
  const { autoFetch = true, forceRefresh = false } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalyzeItem[]>([]);

  const fetchCategories = async (skipCache = false) => {
    if (!skipCache && sessionCache) {
      const isExpired = Date.now() - sessionCache.timestamp > AppConfig.CACHE.CATEGORY_TIMEOUT;

      if (!isExpired) {
        console.log('[useCategory] Using cached data');
        setCategories(sessionCache.categories);
        return;
      } else {
        console.log('[useCategory] Cache expired, fetching new data');
      }
    }

    setLoading(true);
    setError(null);

    try {
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
      const response = await categoryRepository.getCategories(userCode.toString());

      if (response.isSuccess() && response.data) {
        const rawCategories = response.data.data || [];

        // 🔥 Flatten nested structure
        const flattenedCategories = flattenCategories(rawCategories);

        sessionCache = {
          categories: flattenedCategories,
          timestamp: Date.now(),
        };

        setCategories(flattenedCategories);
        console.log('[useCategory] Data fetched and cached');
      } else {
        throw new Error(response.message || 'Failed to fetch categories');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('[useCategory] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new category
   * @param payload - Category data (without usercode, will be auto-filled)
   * @returns Promise with success status and optional message
   */
  const createCategory = async (
    payload: Omit<CreateCategoryPayload, 'usercode'>
  ): Promise<CreateCategoryResult> => {
    setCreating(true);
    setError(null);

    try {
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);

      const response = await categoryRepository.createCategory({
        ...payload,
        usercode: userCode?.toString() || '',
      });

      if (response.isSuccess()) {
        console.log('[useCategory] Category created successfully');

        // Refetch để cập nhật danh sách
        await fetchCategories(true);

        return { success: true };
      } else {
        console.error('[useCategory] Create category failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
      console.error('[useCategory] Error creating category:', err);
      return { success: false, message: errorMessage };
    } finally {
      setCreating(false);
    }
  };

  const analyzeCategory = async (payload: Omit<AnalyzeCategoryPayload, 'usercode'>) => {
    setAnalyzing(true);
    setError(null);

    try {
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);

      const response = await categoryRepository.analyzeCategory({
        ...payload,
        usercode: userCode?.toString() || '',
      });

      if (response.isSuccess() && response.data) {
        setCategoryAnalysis(response.data.category_analyze || []);
        return response.data.category_analyze;
      } else {
        throw new Error(response.message || 'Failed to analyze category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze category';
      setError(errorMessage);
      console.error('[useCategory] Error analyzing category:', err);
      return [];
    } finally {
      setAnalyzing(false);
    }
  };

  const refetch = () => {
    console.log('[useCategory] Force refresh');
    fetchCategories(true);
  };

  const clearCache = () => {
    console.log('[useCategory] Cache cleared');
    sessionCache = null;
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCategories(forceRefresh);
    }
  }, [autoFetch, forceRefresh]);

  return {
    categories,
    loading,
    error,
    creating,
    refetch,
    clearCache,
    createCategory,
    analyzeCategory,
    analyzing,
    categoryAnalysis,
  };
};