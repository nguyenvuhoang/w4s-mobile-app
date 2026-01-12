import { AppConfig } from '@/config/AppConfig';
import StorageKey from '@/constants/StorageKey';
import { Category, categoryRepository } from '@/services/repositories/category.repository';
import StorageService from '@/services/StorageService';
import { useEffect, useState } from 'react';

interface UseCategoryOptions {
  autoFetch?: boolean;
  forceRefresh?: boolean; // Bắt buộc gọi API mới, bỏ qua cache
}

// Session cache - chỉ tồn tại trong runtime, mất khi tắt app
let sessionCache: {
  categories: Category[];
  timestamp: number;
} | null = null;

export const useCategory = (options: UseCategoryOptions = {}) => {
  const { autoFetch = true, forceRefresh = false } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const categoriesData = response.data.data || [];
        
        sessionCache = {
          categories: categoriesData,
          timestamp: Date.now(),
        };
        
        setCategories(categoriesData);
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
    } else {
      console.log('[useCategory] NOT calling fetchCategories. autoFetch:', autoFetch);
    }
  }, [autoFetch, forceRefresh]);

  return {
    categories,
    loading,
    error,
    refetch,
    clearCache, // Export để có thể clear cache khi cần (vd: sau khi tạo/xóa/sửa category)
  };
};

// TODO: Add more hooks when needed
// export const useCategoryOperations = () => {}
// export const useCategoryById = (categoryId?: string) => {}