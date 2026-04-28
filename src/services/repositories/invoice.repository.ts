import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";
import {
  AdvancedSearchInvoicePayload,
  CreateInvoicePayload,
  SimpleSearchInvoicePayload,
  UpdateInvoicePayload,
} from "@/types/Invoice";

export interface PayBillPayload {
  id: number;
  wallet_id: number;
  account_number: string;
  paid_at_utc: string;
}

export const invoiceRepository = {
  /**
   * Create new invoice
   */
  async createInvoice(data: CreateInvoicePayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_CREATE_BILL,
        {
          wallet_id: data.wallet_id,
          account_number: data.account_number,
          category_id: data.category_id,
          payment_transaction_type: data.payment_transaction_type,
          bill_name: data.bill_name,
          business_type: data.business_type,
          recurring: {
            type: data.recurring.type,
            count: data.recurring.count,
            is_forever: data.recurring.is_forever,
            selected_days: data.recurring.selected_days,
          },
          amount: data.amount,
          currency_code: data.currency_code,
          due_at_utc: data.due_at_utc,
          note: data.note,
          contract_number: data.contract_number,
          category_code: data.category_code,
        },
        false
      );
    } catch (error) {
      console.error("[invoiceRepository] Error creating invoice:", error);
      throw error;
    }
  },

  /**
   * Update existing invoice
   */
  async updateInvoice(data: UpdateInvoicePayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_UPDATE_BILL,
        {
          id: data.id,
          wallet_id: data.wallet_id,
          account_number: data.account_number,
          category_id: data.category_id,
          payment_transaction_type: data.payment_transaction_type,
          bill_name: data.bill_name,
          business_type: data.business_type,
          recurring: {
            type: data.recurring.type,
            count: data.recurring.count,
            is_forever: data.recurring.is_forever,
            selected_days: data.recurring.selected_days,
          },
          amount: data.amount,
          currency_code: data.currency_code,
          due_at_utc: data.due_at_utc,
          note: data.note,
          contract_number: data.contract_number,
          category_code: data.category_code,
        },
        false
      );
    } catch (error) {
      console.error("[invoiceRepository] Error updating invoice:", error);
      throw error;
    }
  },

  /**
   * Search invoices via text
   */
  async simpleSearchInvoice(data: SimpleSearchInvoicePayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_SIMPLE_SEARCH_BILL,
        data,
        false
      );
    } catch (error) {
      console.error("[invoiceRepository] Error simple searching invoice:", error);
      throw error;
    }
  },

  /**
   * Delete invoice
   */
  async deleteInvoice(id: number): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_DELETE_BILL,
        { id },
        false
      );
    } catch (error) {
      console.error("[invoiceRepository] Error deleting invoice:", error);
      throw error;
    }
  },

  /**
   * Advanced search invoices
   */
  async advancedSearchInvoice(data: AdvancedSearchInvoicePayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_ADVANCED_SEARCH_BILL,
        {
          user_code: data.user_code || "",
          wallet_id: data.wallet_id || 0,
          business_type: data.business_type || null,
          schedule_type: data.schedule_type || null,
          statuses: data.status || ["Pending", "Paid", "Due"],
          from_due_at_utc: data.from_due_at_utc || "",
          to_due_at_utc: data.to_due_at_utc || "",
          page_index: data.page_index ?? 0,
          page_size: data.page_size ?? 20,
        },
        false
      );
    } catch (error) {
      console.error("[invoiceRepository] Error advanced searching invoice:", error);
      throw error;
    }
  },

  /**
   * Get single invoice
   */
  async getInvoice(id: number): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_BILL,
        { id },
        false
      );
    } catch (error) {
      console.error("[invoiceRepository] Error getting invoice:", error);
      throw error;
    }
  },
  /**
   * Pay a bill (WF_MB_PAY_BILL)
   */
  async payBill(data: PayBillPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_PAY_BILL,
        {
          id: data.id,
          wallet_id: data.wallet_id,
          account_number: data.account_number,
          paid_at_utc: data.paid_at_utc,
        },
        false
      );
    } catch (error) {
      console.error("[invoiceRepository] Error paying bill:", error);
      throw error;
    }
  },
};
