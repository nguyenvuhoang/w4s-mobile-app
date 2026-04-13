import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";
import {
  CreateInvoicePayload,
  SimpleSearchInvoicePayload,
  AdvancedSearchInvoicePayload,
} from "@/types/Invoice";

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
        },
        false
      );
    } catch (error) {
      console.error("[invoiceRepository] Error creating invoice:", error);
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
        data,
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
};
