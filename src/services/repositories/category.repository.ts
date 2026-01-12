// src/services/repositories/category.repository.ts

import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface Category {
  id: string;
  category_code: string;
  wallet_id: string;
  parent_category_id: string;
  category_group: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_type: 'EXPENSE' | 'INCOME' | 'LOAN';
  category_name: string; // JSON string: {"vi":"...", "en":"..."}
  icon: string;
  color: string;
  web_icon: string;
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