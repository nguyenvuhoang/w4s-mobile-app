import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";
import { CreateInvoicePayload } from "@/types/Invoice";

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
};
