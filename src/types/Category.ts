
export interface Category {
  category_id: string;
  wallet_id: string;
  parent_category_id: string;
  category_group: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_type: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_name: string; 
  icon: string;
  color: string;
}

export interface ParsedCategoryName {
  vi: string;
  en: string;
}

export interface SelectedCategoryData {
  category_id: string;
  category_name: string;
  category_type: 'EXPENSE' | 'INCOME' | 'LOAN';
  icon: string;
  color: string;
}

export type CategoryType = 'EXPENSE' | 'INCOME' | 'LOAN';

export interface CreateCategoryRequest {
  wallet_id: string;
  parent_category_id?: string;
  category_type: CategoryType;
  category_name: string; // JSON string
  icon: string;
  color: string;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  category_id: string;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
  message?: string;
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
  message?: string;
}