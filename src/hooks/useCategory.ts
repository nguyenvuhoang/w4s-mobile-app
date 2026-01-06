import { Category, categoryRepository } from '@/services/repositories/category.repository';
import { useEffect, useState } from 'react';

interface UseCategoryOptions {
  autoFetch?: boolean;
}

export const useCategory = (options: UseCategoryOptions = {}) => {
  const { autoFetch = true } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await categoryRepository.getCategories();
      if (response.isSuccess() && response.data) {
        const categoriesData = response.data.items || [];
        setCategories(categoriesData);
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
    fetchCategories();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    } else {
      console.log('[useCategory] NOT calling fetchCategories. autoFetch:', autoFetch);
    }
  }, [autoFetch]);

  return {
    categories,
    loading,
    error,
    refetch,
  };
};

// TODO: Add more hooks when needed
// export const useCategoryOperations = () => {}
// export const useCategoryById = (categoryId?: string) => {}