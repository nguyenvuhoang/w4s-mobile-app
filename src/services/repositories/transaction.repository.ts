import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface TransactionParticipant {
  id?: number;
  DisplayName: string;
  Phone?: string;
  AvatarUrl?: string;
  CounterpartyType?: number;
  IsFavorite?: boolean;
}

export interface CreateTransactionPayload {
  userCode: string;
  username: string;
  account_number: string;
  wallet_id: number;
  type: string; // "01" = INCOME, "02" = EXPENSE, "03" = LOAN
  amount: number;
  fee?: number;
  currency: string;
  category_id: number;
  event_id?: number | null;
  transaction_description?: string;
  location?: string;
  recorded_at: string;
  reminder_at?: string | null;
  is_funding?: boolean;
  is_loan_for_fund?: boolean;
  is_calculate_report?: boolean;
  images?: string[];
  with_users?: TransactionParticipant[];
}

export const transactionRepository = {
  /**
   * Create new transaction (one-time)
   * @param data Transaction payload
   * @returns API response
   */
  async createTransaction(
    data: CreateTransactionPayload,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_CREATE_WALLET_TRANSACTION,
        {
          user_code: data.userCode,
          username: data.username,
          account_number: data.account_number,
          wallet_id: data.wallet_id,
          type: data.type,
          amount: data.amount,
          fee: data.fee || 0,
          currency: data.currency,
          category_id: data.category_id,
          event_id: data.event_id || null,
          transaction_description: data.transaction_description || "",
          location: data.location || "",
          recorded_at: data.recorded_at,
          reminder_at: data.reminder_at || null,
          is_funding: data.is_funding || false,
          is_loan_for_fund: data.is_loan_for_fund || false,
          is_calculate_report:
            data.is_calculate_report !== undefined
              ? data.is_calculate_report
              : true,
          images: data.images || [],
          with_users: data.with_users || [],
        },
        false,
      );
    } catch (error) {
      console.error(
        "[transactionRepository] Error creating transaction:",
        error,
      );
      throw error;
    }
  },
};
