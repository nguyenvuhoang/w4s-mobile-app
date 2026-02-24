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
  usercode: string;
  period_type: string;
  take: number;
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
  async getCategories(userCode: string): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_WALLET_CONTRACT_CATEGORY,
        {
          usercode: userCode,
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
          usercode: data.usercode,
          period_type: data.period_type,
          take: data.take,
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

  // TODO: Add more method
  // async createCategory(data: any): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflowNew(
  //     WORKFLOWCODE.MB_CREATE_CATEGORY,
  //     data,
  //     false
  //   );
  // },

  // async updateCategory(categoryId: string, data: any): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflowNew(
  //     WORKFLOWCODE.MB_UPDATE_CATEGORY,
  //     {
  //       category_id: categoryId,
  //       ...data,
  //     },
  //     false
  //   );
  // },

  // async deleteCategory(categoryId: string): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflowNew(
  //     WORKFLOWCODE.MB_DELETE_CATEGORY,
  //     {
  //       category_id: categoryId,
  //     },
  //     false
  //   );
  // },
};