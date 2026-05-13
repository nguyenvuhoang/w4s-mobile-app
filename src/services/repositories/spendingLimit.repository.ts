import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface SpendingLimit {
  id?: string;
  spending_limit_id?: number;
  contract_number: string;
  period: string; // 'Day', 'Week', 'Month'
  limit_amount: number;
  used_amount?: number;
  currency_code: string;
  status?: string;
  is_active?: boolean;
  category_code?: string;
  wallet_id?: number;
}

export interface CreateSpendingLimitPayload {
  contract_number: string;
  period: string;
  limit_amount: number;
  currency_code: string;
  category_code?: string | null;
  wallet_id?: number | null;
}

export interface UpdateSpendingLimitPayload {
  spending_limit_id: number;
  period: string;
  limit_amount: number;
  currency_code: string;
  is_active: boolean;
  contract_number?: string;
  category_code?: string | null;
  wallet_id?: number | null;
}

export interface AdvancedSearchSpendingLimitPayload {
  contract_number: string;
  period: string | null;
  is_active: boolean;
  page_index: number;
  page_size: number;
}

export const spendingLimitRepository = {
  /**
   * Get list of spending limits
   */
  async getSpendingLimits(contractNumber: string): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_LIST_SPENDING_LIMIT,
        {
          contract_number: contractNumber,
        },
        false,
        true
      );
    } catch (error) {
      console.error("[spendingLimitRepository] Error fetching limits:", error);
      throw error;
    }
  },

  /**
   * Create a new spending limit
   */
  async createSpendingLimit(payload: CreateSpendingLimitPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_CREATE_SPENDING_LIMIT,
        {
          contract_number: payload.contract_number,
          period: payload.period,
          limit_amount: payload.limit_amount,
          currency_code: payload.currency_code,
          category_code: payload.category_code || null,
          wallet_id: payload.wallet_id === 0 ? null : (payload.wallet_id !== undefined ? payload.wallet_id : null),
        },
        false,
        true
      );
    } catch (error) {
      console.error("[spendingLimitRepository] Error creating limit:", error);
      throw error;
    }
  },

  /**
   * Update an existing spending limit
   */
  async updateSpendingLimit(payload: UpdateSpendingLimitPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_UPDATE_SPENDING_LIMIT,
        {
          spending_limit_id: payload.spending_limit_id,
          period: payload.period,
          limit_amount: payload.limit_amount,
          currency_code: payload.currency_code,
          is_active: payload.is_active,
          contract_number: payload.contract_number,
          category_code: payload.category_code || null,
          wallet_id: payload.wallet_id === 0 ? null : (payload.wallet_id !== undefined ? payload.wallet_id : null),
        },
        false,
        true
      );
    } catch (error) {
      console.error("[spendingLimitRepository] Error updating limit:", error);
      throw error;
    }
  },

  /**
   * Delete a spending limit
   */
  async deleteSpendingLimit(spendingLimitId: number): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_DELETE_SPENDING_LIMIT,
        {
          spending_limit_id: spendingLimitId,
        },
        false,
        true
      );
    } catch (error) {
      console.error("[spendingLimitRepository] Error deleting limit:", error);
      throw error;
    }
  },

  /**
   * Advanced search for spending limits
   */
  async advancedSearchSpendingLimit(payload: AdvancedSearchSpendingLimitPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_ADVANCED_SEARCH_SPENDING_LIMIT,
        {
          contract_number: payload.contract_number,
          period: payload.period,
          is_active: payload.is_active,
          page_index: payload.page_index,
          page_size: payload.page_size,
        },
        false,
        true
      );
    } catch (error) {
      console.error("[spendingLimitRepository] Error searching limits:", error);
      throw error;
    }
  },
};

