import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

/* =======================
 * Types & Interfaces
 * ======================= */

export type PeriodType = "D" | "M" | "Y";

export interface FinanceSummaryRequest {
  usercode: string;
  period_type: PeriodType;
  month?: number;
  year?: number;
}

export interface GetWalletOpeningClosingBalancePayload {
  usercode: string;
  period_type: string;
  anchor_date: string;
  type: string;
  wallet_id?: number;
}

/* =======================
 * Repository
 * ======================= */

export const financeSummaryRepository = {
  /**
   * Lấy tổng kết thu / chi theo kỳ
   * - period_type:
   *   D: Day
   *   M: Month
   *   Y: Year
   */
  async getIncomeExpenseSummary(
    params: FinanceSummaryRequest,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_USER_INCOME_EXPENSE_SUMMARY,
        {
          usercode: params.usercode,
          period_type: params.period_type,
        },
        false,
        true,
      );
    } catch (error) {
      console.error(
        "[financeSummaryRepository] Error fetching income expense summary:",
        error,
      );
      throw error;
    }
  },

  async getTotalBalance(usercode: string): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_WALLET_TOTAL_BALANCE,
        {
          usercode: usercode,
        },
        false,
        true,
      );
    } catch (error) {
      console.error(
        "[financeSummaryRepository] Error fetching Total Balance:",
        error,
      );
      throw error;
    }
  },

  async getWalletOpeningClosingBalance(
    params: GetWalletOpeningClosingBalancePayload,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_WALLET_OPENING_CLOSING_BALANCE,
        {
          usercode: params.usercode,
          period_type: params.period_type,
          anchor_date: params.anchor_date,
          type: params.type,
          wallet_id: params.wallet_id,
        },
        false,
        true,
      );
    } catch (error) {
      console.error(
        "[financeSummaryRepository] Error fetching Wallet Opening Closing Balance:",
        error,
      );
      throw error;
    }
  },

  /**
   * Lấy chi tiêu theo từng ngày trong tháng
   * Params: usercode, month (1-12), year (YYYY), wallet_id? (tùy chọn)
   */
  async getMonthlyExpense(params: {
    usercode: string;
    anchor_date: string;
    wallet_id?: number;
  }): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_WALLET_MONTHLY_EXPENSE,
        {
          usercode: params.usercode,
          anchor_date: params.anchor_date,
          wallet_id: params.wallet_id,
        },
        false,
        true,
      );
    } catch (error) {
      console.error(
        "[financeSummaryRepository] Error fetching monthly expense:",
        error,
      );
      throw error;
    }
  },

  async getMonthlyIncome(params: {
    usercode: string;
    anchor_date: string;
    wallet_id?: number;
  }): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_WALLET_MONTHLY_INCOME,
        {
          usercode: params.usercode,
          anchor_date: params.anchor_date,
          wallet_id: params.wallet_id,
        },
        false,
        true,
      );
    } catch (error) {
      console.error(
        "[financeSummaryRepository] Error fetching monthly income:",
        error,
      );
      throw error;
    }
  },

  async getMonthlyDebitSummary(params: {
    usercode: string;
    anchor_date: string;
    wallet_id?: number;
  }): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_WALLET_MONTHLY_DEBIT_SUMMARY,
        {
          usercode: params.usercode,
          anchor_date: params.anchor_date,
          wallet_id: params.wallet_id,
        },
        false,
        true,
      );
    } catch (error) {
      console.error(
        "[financeSummaryRepository] Error fetching monthly debit summary:",
        error,
      );
      throw error;
    }
  },
};

