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
        WORKFLOWCODE.WF_MB_WALLET_INCOME_EXPENSE_SUMMARY,
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
};
