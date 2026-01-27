import { AppConfig } from '@/config/AppConfig';
import StorageKey from '@/constants/StorageKey';
import { Category, categoryRepository, CreateCategoryPayload } from '@/services/repositories/category.repository';
import StorageService from '@/services/StorageService';
import { useEffect, useState } from 'react';

interface UseCategoryOptions {
  autoFetch?: boolean;
  forceRefresh?: boolean;
}

interface CreateCategoryResult {
  success: boolean;
  message?: string;
}

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
  };
};