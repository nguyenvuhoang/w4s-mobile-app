// src/services/repositories/category.repository.ts

import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface Category {
  category_id: string;
  wallet_id: string;
  parent_category_id: string;
  category_group: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_type: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_name: string; // JSON string: {"vi":"...", "en":"..."}
  icon: string;
  color: string;
}

export const categoryRepository = {
  /**
   * Get all categories for a wallet
   */
  async getCategories(): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_RETRIEVE_WALLET_CATEGORY,
        {
          search_text: "",
          page_index: 0,
          page_size: 10
        },
        false,
        true
      );
    } catch (error) {
      console.error('[categoryRepository] Error fetching categories:', error);
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