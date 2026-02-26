import {
    categoryRepository,
    UpdateCategoryPayload,
} from '@/services/repositories/category.repository';
import { useState } from 'react';

interface UpdateCategoryParams {
  id: number;
  parent_category_id: number;
  category_group: string;
  category_type: string;
  category_name: string;
  icon: string;
  color: string;
  contract_number: string;
}

export const useEditCategory = () => {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cập nhật thông tin category
   */
  const updateCategory = async (params: UpdateCategoryParams): Promise<boolean> => {
    setUpdating(true);
    setError(null);

    try {
      const payload: UpdateCategoryPayload = {
        id: params.id,
        parent_category_id: params.parent_category_id,
        category_group: params.category_group,
        category_type: params.category_type,
        category_name: params.category_name,
        icon: params.icon,
        color: params.color,
        contract_number: params.contract_number,
      };

      const response = await categoryRepository.updateCategory(payload);

      if (!response.isSuccess()) {
        throw new Error(response.getError?.() || response.message || 'Cập nhật danh mục thất bại');
      }

      console.log('[useEditCategory] Category updated successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cập nhật danh mục thất bại';
      setError(message);
      console.error('[useEditCategory] updateCategory failed:', err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Xóa category theo category_id (number)
   */
  const deleteCategory = async (categoryId: number): Promise<boolean> => {
    setDeleting(true);
    setError(null);

    try {
      const response = await categoryRepository.deleteCategory(categoryId);

      if (!response.isSuccess()) {
        throw new Error(response.getError?.() || response.message || 'Xóa danh mục thất bại');
      }

      console.log('[useEditCategory] Category deleted successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xóa danh mục thất bại';
      setError(message);
      console.error('[useEditCategory] deleteCategory failed:', err);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    updating,
    deleting,
    error,
    updateCategory,
    deleteCategory,
  };
};
