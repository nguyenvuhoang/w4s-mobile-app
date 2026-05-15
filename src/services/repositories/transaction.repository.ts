import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";
import StorageService from "../StorageService";

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
  contract_number: string;
  account_number: string;
  wallet_id: number;
  type: string; // "01" = INCOME, "02" = EXPENSE, "03" = LOAN
  amount: number;
  fee?: number;
  currency: string;
  category_id: number;
  category_code?: string;
  event_id?: number | null;
  loan_id?: number | null;
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

export interface GetRecentTransactionsPayload {
  usercode: string;
  page_index: number;
  page_size: number;
}

export interface UpdateTransactionPayload {
  transaction_id: string;
  transaction_description?: string;
  description?: string;
  amount: number;
  fee?: number;
  currency: string;
  category_id: number;
  category_code?: string;
  event_id?: string | null;
  location?: string;
  transaction_date: string;
  reminder_at?: string | null;
  is_calculate_report?: boolean;
  images?: string[];
  with_users?: TransactionParticipant[];
  user_code: string;
  current_user_code: string;
  channel_id: string;
  reference_id: string;
}

export interface AdvancedSearchTransactionPayload {
  transaction_id?: string;
  wallet_id?: number;
  category_id?: number;
  category_code?: string;
  event_id?: number;
  loan_id?: number;
  bill_id?: number;
  wallet_budget_id?: number;
  from_transaction_date?: string;
  to_transaction_date?: string;
  page_index: number;
  page_size: number;
  description?: string;
  transaction_description?: string;
  contract_number?: string;
  transaction_code?: string;
}

export interface RefundTransactionPayload {
  transaction_id: string;
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
          contract_number: data.contract_number,
          account_number: data.account_number,
          wallet_id: data.wallet_id,
          type: data.type,
          amount: data.amount,
          fee: data.fee || 0,
          currency: data.currency,
          category_id: data.category_id,
          event_id: data.event_id || null,
          loan_id: data.loan_id || null,
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
          is_support_report: true,
          category_code: data.category_code,
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
  /**
   * Update transaction
   * @param data Transaction payload
   * @returns API response
   */
  async updateTransaction(
    data: UpdateTransactionPayload,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_UPDATE_WALLET_TRANSACTION,
        {
          transaction_id: data.transaction_id,
          transaction_description: data.transaction_description || "",
          description: data.description || "",
          amount: data.amount,
          fee: data.fee || 0,
          currency: data.currency,
          category_id: data.category_id,
          event_id: data.event_id || null,
          location: data.location || "",
          transaction_date: data.transaction_date,
          reminder_at: data.reminder_at || null,
          is_calculate_report: data.is_calculate_report ?? true,
          images: data.images || [],
          with_users: data.with_users || [],
          user_code: data.user_code,
          current_user_code: data.current_user_code,
          channel_id: data.channel_id,
          reference_id: data.reference_id,
          category_code: data.category_code,
        },
        false,
      );
    } catch (error) {
      console.error(
        "[transactionRepository] Error updating transaction:",
        error,
      );
      throw error;
    }
  },
  /**
   * Get recent transactions
   * @param data Payload
   * @returns List of transactions
   */
  async getRecentTransactions(
    data: GetRecentTransactionsPayload,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_WALLET_RECENT_TRANSACTIONS,
        {
          usercode: data.usercode,
          page_index: data.page_index,
          page_size: data.page_size,
        },
        false,
      );
    } catch (error) {
      console.error(
        "[transactionRepository] Error getting recent transactions:",
        error,
      );
      throw error;
    }
  },
  /**
   * Get recent transactions
   * @param data Payload
   * @returns List of transactions
   */
  async getTransactionsByTransactionId(
    transactionid: string,
    usercode: string,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_TRAN_BY_TRANSACTIONID,
        {
          transaction_id: transactionid,
          usercode: usercode,
        },
        false,
      );
    } catch (error) {
      console.error(
        "[transactionRepository] Error getting transactions by transaction id:",
        error,
      );
      throw error;
    }
  },
  /**
   * Delete transaction
   * @param transactionid Transaction id
   * @returns API response
   */
  async deleteTransaction(
    transactionid: string,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_DELETE_WALLET_TRANSACTION,
        {
          transaction_id: transactionid,
        },
        false,
      );
    } catch (error) {
      console.error(
        "[transactionRepository] Error deleting transaction:",
        error,
      );
      throw error;
    }
  },
  /**
   * Advanced search transaction
   * @param data Payload
   * @returns API response
   */
  async advancedSearchTransactions(
    data: AdvancedSearchTransactionPayload,
  ): Promise<BaseResponseModel> {
    try {
      const appInfo = await StorageService.getAppInfo();
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_ADVANCED_SEARCH_WALLET_TRANSACTION,
        {
          transaction_id: data.transaction_id || "",
          wallet_id: data.wallet_id || 0,
          category_id: data.category_id || 0,
          category_code: data.category_code || "",
          event_id: data.event_id || 0,
          loan_id: data.loan_id || 0,
          bill_id: data.bill_id || 0,
          wallet_budget_id: data.wallet_budget_id || 0,
          from_transaction_date: data.from_transaction_date || "",
          to_transaction_date: data.to_transaction_date || "",
          page_index: data.page_index || 1,
          page_size: data.page_size || 10,
          contract_number: appInfo?.contract_number || "",
          type: data.transaction_code || "",
        },
        false,
      );
    } catch (error) {
      console.error(
        "[transactionRepository] Error advanced searching transactions:",
        error,
      );
      throw error;
    }
  },
  /**
   * Simple search transaction
   * @param data Payload
   * @returns API response
   */
  async simpleSearchTransactions(data: {
    search_text: string;
    page_index: number;
    page_size: number;
  }): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_SIMPLE_SEARCH_WALLET_TRANSACTION,
        {
          search_text: data.search_text,
          page_index: data.page_index,
          page_size: data.page_size,
        },
        false,
      );
    } catch (error) {
      console.error(
        "[transactionRepository] Error simple searching transactions:",
        error,
      );
      throw error;
    }
  },
  /**
   * Refund transaction
   * @param data Payload
   * @returns API response
   */
  async refundTransaction(
    data: RefundTransactionPayload,
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_REFUND_WALLET_TRANSACTION,
        {
          transaction_id: data.transaction_id,
        },
        false,
      );
    } catch (error) {
      console.error(
        "[transactionRepository] Error refunding transaction:",
        error,
      );
      throw error;
    }
  },
};
