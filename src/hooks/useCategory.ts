import StorageKey from '@/constants/StorageKey';
import { categoryCache } from '@/features/category/hooks/useCategorycache';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import CurrencyEventEmitter from '@/services/CurrencyEventEmitter';
import {
  AnalyzeCategoryPayload,
  Category,
  categoryRepository,
  CreateCategoryPayload,
} from '@/services/repositories/category.repository';
import StorageService from '@/services/StorageService';
import TransactionEventEmitter from '@/services/TransactionEventEmitter';
import { PERIOD_TYPE } from '@/constants/PeriodType';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface UseCategoryOptions {
  autoFetch?: boolean;
  forceRefresh?: boolean;
  /**
   * Truyền walletId để fetch category của 1 ví cụ thể.
   * Nếu không truyền → tự động fetch tất cả ví (dùng cho màn hình tổng quan).
   */
  walletId?: number;
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

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

const flattenCategories = (categories: Category[]): Category[] => {
  const result: Category[] = [];
  categories.forEach(category => {
    result.push(category);
    if (category.children?.length) {
      result.push(...category.children);
    }
  });
  return result;
};

// ─────────────────────────────────────────────
// useTopSpendingCategories (không thay đổi)
// ─────────────────────────────────────────────

export const useTopSpendingCategories = () => {
  const [data, setData] = useState<TopSpendingCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastParams = useRef<{ period_type: string; take: number }>({ period_type: PERIOD_TYPE.MONTH, take: 5 });

  const fetchTopCategories = useCallback(async (
    period_type: string = PERIOD_TYPE.MONTH,
    take: number = 5
  ) => {
    lastParams.current = { period_type, take };
    setLoading(true);
    setError(null);

    try {
      const userCode = await StorageService.getItem(StorageKey.userCode);

      const currentDate = new Date();
      const formattedAnchorDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

      const response = await categoryRepository.getTopSpendingCategories({
        anchor_date: formattedAnchorDate,
        page_index: 0,
        page_size: take,
        period_type,
        usercode: userCode?.toString() || '',
      });

      if (response.isSuccess() && response.data) {
        let list: TopSpendingCategoryItem[] = [];
        if (Array.isArray(response.data)) {
          list = response.data;
        } else if (
          response.data.data &&
          Array.isArray(response.data.data) &&
          response.data.data.length > 0 &&
          response.data.data[0].top_categories
        ) {
          list = response.data.data[0].top_categories;
        } else {
          list = response.data.data || response.data.categories || response.data.category_analyze || [];
        }
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

  useEffect(() => {
    const handleRefresh = () => {
      fetchTopCategories(lastParams.current.period_type, lastParams.current.take);
    };

    TransactionEventEmitter.onTransactionChanged(handleRefresh);
    CurrencyEventEmitter.onCurrencyChanged(handleRefresh);

    return () => {
      TransactionEventEmitter.offTransactionChanged(handleRefresh);
      CurrencyEventEmitter.offCurrencyChanged(handleRefresh);
    };
  }, [fetchTopCategories]);

  return { data, loading, error, fetchTopCategories };
};

// ─────────────────────────────────────────────
// useCategory
// ─────────────────────────────────────────────

export const useCategory = (options: UseCategoryOptions = {}) => {
  const { autoFetch = true, forceRefresh = false, walletId } = options;

  const { wallets } = useWallet();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalyzeItem[]>([]);

  // ── Fetch 1 ví ──────────────────────────────
  const fetchSingleWallet = async (wId: number, skipCache = false): Promise<Category[]> => {
    if (!skipCache) {
      const cached = categoryCache.getByWallet(wId);
      if (cached) {
        console.log(`[useCategory] Cache hit for wallet ${wId}`);
        return cached;
      }
    }

    const userCode = await StorageService.getItem(StorageKey.userCode);
    
    // Get contract_number from appInfo
    const appInfoStr = await StorageService.getItem(StorageKey.appInfo);
    let contractNumber = '';
    if (appInfoStr) {
      try {
        const appInfo = JSON.parse(appInfoStr);
        contractNumber = appInfo?.contract_number || '';
      } catch (e) {
        console.warn('[useCategory] Failed to parse appInfo', e);
      }
    }

    const response = await categoryRepository.getCategories(userCode.toString(), wId, contractNumber);

    if (response.isSuccess() && response.data) {
      const flat = flattenCategories(response.data.data || []);
      categoryCache.set(wId, flat);
      console.log(`[useCategory] Fetched and cached wallet ${wId}`);
      return flat;
    }

    throw new Error(response.message || `Failed to fetch categories for wallet ${wId}`);
  };

  // ── Fetch chính: 1 ví hoặc tất cả ví song song ──
  const fetchCategories = useCallback(async (skipCache = false) => {
    setLoading(true);
    setError(null);

    try {
      if (walletId !== undefined) {
        // Màn hình có wallet context hoặc chọn "Tất cả" (walletId=0) → fetch 1 lần
        const result = await fetchSingleWallet(walletId, skipCache);
        setCategories(result);
      } else {
        // Màn hình tổng quan → fetch song song tất cả ví chưa có cache
        const walletIds = wallets.map(w => w.walletId);

        if (walletIds.length === 0) {
          setCategories([]);
          return;
        }

        const uncachedIds = skipCache
          ? walletIds
          : walletIds.filter(id => !categoryCache.hasWallet(id));

        // Fetch song song các ví chưa có cache
        if (uncachedIds.length > 0) {
          await Promise.all(uncachedIds.map(id => fetchSingleWallet(id, true)));
        }

        // Gộp tất cả từ cache
        const all = walletIds.flatMap(id => categoryCache.getByWallet(id) || []);
        setCategories(all);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('[useCategory] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [walletId, wallets]);

  // ── Create ───────────────────────────────────
  const createCategory = async (
    payload: Omit<CreateCategoryPayload, 'usercode'>
  ): Promise<CreateCategoryResult> => {
    setCreating(true);
    setError(null);

    try {
      const userCode = await StorageService.getItem(StorageKey.userCode);

      const response = await categoryRepository.createCategory({
        ...payload,
        usercode: userCode?.toString() || '',
      });

      if (response.isSuccess()) {

        categoryCache.invalidateAll();

        await fetchCategories(true);
        return { success: true };
      } else {
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

  // ── Analyze ──────────────────────────────────
  const analyzeCategory = useCallback(async (
    payload: Omit<AnalyzeCategoryPayload, 'usercode'>
  ) => {
    setAnalyzing(true);
    setError(null);

    try {
      const userCode = await StorageService.getItem(StorageKey.userCode);

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
  }, []);

  // ── Auto fetch ───────────────────────────────
  useEffect(() => {
    if (autoFetch) {
      fetchCategories(forceRefresh);
    }
  }, [autoFetch, forceRefresh, walletId]);

  const refetch = useCallback(() => fetchCategories(true), [fetchCategories]);

  // ── Expose ───────────────────────────────────
  return {
    categories,
    loading,
    error,
    creating,

    refetch,
    clearCache: () => walletId
      ? categoryCache.invalidateWallet(walletId)
      : categoryCache.invalidateAll(),

    // Global lookup — dùng được kể cả khi không có walletId
    getCategoryById: categoryCache.getById,

    /** Tra cứu nhanh theo category_code string (ví dụ: "LOAN_COLLECT") */
    getCategoryByCode: categoryCache.getByCode,

    createCategory,
    analyzeCategory,
    analyzing,
    categoryAnalysis,
  };
};
