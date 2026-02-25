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
  icon: string;
  color: string;
  default_currency: string;
  available_balance: number;
  status: string;
}

export const walletTrackerRepository = {
  /**
   * Create a new wallet tracker
   */
  async createWalletTracker(
    userCode: string,
    walletName: string,
    currency: string,
    color: string,
    icon: string,
    isIncludeReport: boolean,
    amount: number,
    walletType: string,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_ADD_ON_WALLET,
        {
          wallet_name: walletName,
          usercode: userCode,
          base_currency: currency,
          color: color,
          icon: icon,
          is_include_report: isIncludeReport,
          amount: amount,
          wallet_type: "TWCR",
          classification: "INCOME",
        },
        false,
        true,
      );
    } catch (error) {
      console.error(
        "[walletTrackerRepository] Error creating wallet trackker:",
        error,
      );
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

  async deleteWalletTracker(userCode: string, walletId: number): Promise<BaseResponseModel> {
    return await apiService.executeWorkflowNew(
      WORKFLOWCODE.WF_MB_DELETE_WALLET,
      {
        usercode: userCode,
        wallet_id: walletId,
      },
      false
    );
  },
};
