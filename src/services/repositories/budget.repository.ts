/**
 * Budget Repository
 * Repository for handling budget-related API calls using executeWorkflow
 */

import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface BudgetSearchParams {
  userCode: string;
  status?: string;
  budget_type?: string;
  wallet_id?: number;
  from_date?: string;
  to_date?: string;
  search_text?: string;
  page_index: number;
  page_size: number;
}

export interface BudgetSummaryParams {
  wallet_id: number;
  period_type: string;
}

export interface AdvancedSearchBudgetParams {
  wallet_id: number;
  period_type: string;
  page_index: number;
  page_size: number;
  only_current_period?: boolean;
}

export interface CreateBudgetPayload {
  amount: number;
  category_id: number;
  end_date: string;
  period_type: string;
  source_gudget: string;
  source_tracker: number;
  start_date: string;
  wallet_id: number;
  note?: string;
  include_in_report?: boolean;
  is_auto_repeat?: boolean;
  contract_number?: string;
}

export interface UpdateBudgetPayload {
  budget_id: number;
  amount: number;
  category_id: number;
  end_date: string;
  period_type: string;
  source_gudget: string;
  source_tracker: number;
  start_date: string;
  wallet_id: number;
  note?: string;
  include_in_report?: boolean;
  is_auto_repeat?: boolean;
}

export interface UpdateBudgetParams {
  budget_id: number;
  title?: string;
  description?: string;
  location?: string;
  color?: string;
  icon?: string;
  start_on_utc?: string;
  end_on_utc?: string;
  is_all_day?: boolean;
  budget_type?: string;
  status?: string;
}

export const budgetRepository = {
  /**
   * Get budgets list
   */
  async getBudgets(params: BudgetSearchParams): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_RETRIEVE_WALLET_EVENT,
        {
          usercode: params.userCode,
          search_text: params.search_text || "",
          page_index: params.page_index,
          page_size: params.page_size,
        },
        false,
        true
      );
    } catch (error) {
      console.error("[budgetRepository] Error fetching budgets:", error);
      throw error;
    }
  },

  /**
   * Get budget summary
   */
  async getBudgetSummary(params: BudgetSummaryParams): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_BUDGET_SUMMARY,
        {
          wallet_id: params.wallet_id,
          period_type: params.period_type,
        },
        false,
        true
      );
    } catch (error) {
      console.error("[budgetRepository] Error fetching budget summary:", error);
      throw error;
    }
  },

  /**
   * Advanced search budget
   */
  async advancedSearchBudget(params: AdvancedSearchBudgetParams): Promise<BaseResponseModel> {
    try {
      const { only_current_period = true, ...rest } = params;
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_ADVANCED_SEARCH_WALLET_BUDGET,
        {
          only_current_period,
          ...rest,
        },
        false,
        true
      );
    } catch (error) {
      console.error("[budgetRepository] Error advanced searching budget:", error);
      throw error;
    }
  },

  /**
   * Get budget by ID
   */
  //   async getBudgetById(budgetId: number): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_GET_DETAIL,
  //         {
  //           budget_id: budgetId,
  //         },
  //         false,
  //         true
  //       );
  //     } catch (error) {
  //       console.error("[budgetRepository] Error fetching budget detail:", error);
  //       throw error;
  //     }
  //   },

  /**
   * Create new budget
   */
  async createBudget(data: CreateBudgetPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_CREATE_WALLET_BUDGET,
        {
          amount: data.amount,
          category_id: data.category_id,
          end_date: data.end_date,
          period_type: data.period_type,
          source_gudget: data.source_gudget,
          source_tracker: data.source_tracker,
          start_date: data.start_date,
          wallet_id: data.wallet_id,
          note: data.note,
          include_in_report: data.include_in_report,
          is_auto_repeat: data.is_auto_repeat,
          contract_number: data.contract_number,
        },
        false
      );
    } catch (error) {
      console.error("[budgetRepository] Error creating budget:", error);
      throw error;
    }
  },

  /**
   * Update budget
   */
  async updateBudget(data: UpdateBudgetPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_UPDATE_WALLET_BUDGET,
        {
          budget_id: data.budget_id,
          amount: data.amount,
          category_id: data.category_id,
          end_date: data.end_date,
          period_type: data.period_type,
          source_gudget: data.source_gudget,
          source_tracker: data.source_tracker,
          start_date: data.start_date,
          wallet_id: data.wallet_id,
          note: data.note,
          include_in_report: data.include_in_report,
          is_auto_repeat: data.is_auto_repeat,
        },
        false
      );
    } catch (error) {
      console.error("[budgetRepository] Error updating budget:", error);
      throw error;
    }
  },

  /**
   * Delete budget
   */
  //   async deleteBudget(budgetId: number): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_DELETE,
  //         {
  //           budget_id: budgetId,
  //         },
  //         false
  //       );
  //     } catch (error) {
  //       console.error("[budgetRepository] Error deleting budget:", error);
  //       throw error;
  //     }
  //   },

  /**
   * Complete budget (update status to COMPLETED)
   */
  //   async completeBudget(budgetId: number): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_UPDATE,
  //         {
  //           budget_id: budgetId,
  //           status: "COMPLETED",
  //         },
  //         false
  //       );
  //     } catch (error) {
  //       console.error("[budgetRepository] Error completing budget:", error);
  //       throw error;
  //     }
  //   },

  /**
   * Reactivate budget (update status to ACTIVE)
   */
  //   async reactivateBudget(budgetId: number): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_UPDATE,
  //         {
  //           budget_id: budgetId,
  //           status: "ACTIVE",
  //         },
  //         false
  //       );
  //     } catch (error) {
  //       console.error("[budgetRepository] Error reactivating budget:", error);
  //       throw error;
  //     }
  //   },
};
