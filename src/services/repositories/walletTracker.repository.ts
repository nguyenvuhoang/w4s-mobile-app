// src/services/repositories/category.repository.ts

import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface Wallet {
  wallet_id: string;
  contract_number: string;
  user_code: string;
  wallet_name: string;
  wallet_type: string;
  wallet_icon: string;
  wallet_color: string;
  default_currency: string;
  balance: number;
  status: string;
}

export const walletTrackerRepository = {
  /**
   * Get all wallet tracker
   */
  async getWalletList(userCode: string): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_LIST_WALLET,
        {
          usercode: userCode
        },
        false,
        true
      );
    } catch (error) {
      console.error('[walletTrackerRepository] Error fetching categories:', error);
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