// src/services/repositories/category.repository.ts

import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface Category {
  id: number;
  category_code: string;
  wallet_id: number;
  parent_category_id: number;
  category_group: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_type: string;
  category_name: string;
  icon: string;
  color: string;
  web_icon: string;
  children?: Category[];
}

export interface GetTopSpendingCategoriesPayload {
  anchor_date: string;
  page_index: number;
  page_size: number;
  period_type: string;
  usercode: string;
}


export interface CreateCategoryPayload {
  category_group: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_name: string;
  category_type: 'EXPENSE' | 'INCOME' | 'LOAN';
  color: string;
  icon: string;
  parent_category_id?: number | string;
  usercode: string;
}

export interface UpdateCategoryPayload {
  id: number;
  parent_category_id: number;
  category_group: string;
  category_type: string;
  category_name: string;
  icon: string;
  color: string;
  contract_number: string;
}

export interface AnalyzeCategoryPayload {
  usercode: string;
  wallet_id: number;
  anchor_date: string;
  period_type: string;
}


export const categoryRepository = {
  /**
   * Get all categories for a wallet
   */
  async getCategories(userCode: string, walletID: number
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_WALLET_CONTRACT_CATEGORY,
        {
          usercode: userCode,
          wallet_id: walletID,
        },
        false,
        true
      );
    } catch (error) {
      console.error('[categoryRepository] Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Get top spending categories
   */
  async getTopSpendingCategories(
    data: GetTopSpendingCategoriesPayload
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_TOP_SPENDING_CATEGORIES,
        {
          anchor_date: data.anchor_date,
          page_index: data.page_index,
          page_size: data.page_size,
          period_type: data.period_type,
          usercode: data.usercode,
        },
        false,
        true
      );
    } catch (error) {
      console.error(
        "[categoryRepository] Error fetching top spending categories:",
        error
      );
      throw error;
    }
  },

  /**
   * Create a new category
   */
  async createCategory(
    payload: CreateCategoryPayload
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_CREATE_WALLET_CATEGORY,
        {
          ...payload
        },
        false,
        true
      );
    } catch (error) {
      console.error('[categoryRepository] Error creating category:', error);
      throw error;
    }
  },

  /**
   * Analyze category
   */
  async analyzeCategory(
    payload: AnalyzeCategoryPayload
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_WALLET_CATEGORY_ANALYZE,
        {
          ...payload
        },
        false,
        true
      );
    } catch (error) {
      console.error('[categoryRepository] Error analyzing category:', error);
      throw error;
    }
  },

  async updateCategory(
    payload: UpdateCategoryPayload
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_UPDATE_WALLET_CATEGORY,
        {
          ...payload
        },
        false,
        true
      );
    } catch (error) {
      console.error('[categoryRepository] Error updating category:', error);
      throw error;
    }
  },

  async deleteCategory(categoryId: number): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_DELETE_WALLET_CATEGORY,
      {
        category_id: categoryId,
      },
      false,
      true
    );
  },
};
