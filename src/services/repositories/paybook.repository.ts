import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";
import type { SearchLoanPayload } from "@/features/paybook/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LoanType = "LEND" | "BORROW";
export type CounterpartyType = "INDIVIDUAL" | "MERCHANT";
export type InterestRateType = "FIXED" | "FLOATING";
export type InterestCalcMethod = "REDUCING" | "FLAT";
export type PaymentType = "INSTALLMENT" | "ONE_TIME";

// ─── Create Payload ──────────────────────────────────────────────────────────

export type PeriodUnit = "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";

export interface FloatingRatePeriod {
  from_installment: number; // áp dụng từ kỳ này
  rate: number;             // %/năm
}

export interface LoanScheduleItem {
  installment_no: number;
  from_date: string;
  to_date: string;
  due_date: string;
  principal_due_amount: number;
  interest_due_amount?: number;
  note?: string;
}

export interface CreateLoanPayload {
  wallet_id: number;
  loan_type: LoanType;
  counterparty_name: string;
  counterparty_type: CounterpartyType;
  loan_description: string;
  currency_code: string;
  loan_limit: number;
  principal_amount: number;
  interest_rate: number;
  interest_rate_type: InterestRateType;
  interest_calc_method: InterestCalcMethod;
  start_date: string;
  maturity_date: string;
  payment_type: PaymentType;
  /** Lịch trả nợ — bắt buộc nếu payment_type = INSTALLMENT, tự sinh client-side */
  schedules?: LoanScheduleItem[];
  note?: string;
}

export interface UpdateLoanPayload {
  id: number;
  counterparty_name: string;
  counterparty_type: CounterpartyType | string;
  description: string;
  principal_amount: number;
  balance?: number;
  interest_rate: number;
  interest_rate_type: InterestRateType | string;
  interest_calc_method: InterestCalcMethod | string;
  start_date: string;
  maturity_date: string;
  status: string;
  payment_type: PaymentType | string;
  total_installments?: number | null;
  note?: string;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export const paybookRepository = {
  /**
   * Tạo sổ nợ / khoản vay mới
   * workflowid: WF_MB_CREATE_LOAN
   */
  async createLoan(payload: CreateLoanPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_CREATE_LOAN,
        {
          wallet_id: payload.wallet_id,
          loan_type: payload.loan_type,
          counterparty_name: payload.counterparty_name,
          counterparty_type: payload.counterparty_type,
          loan_description: payload.loan_description,
          currency_code: payload.currency_code,
          loan_limit: payload.loan_limit,
          principal_amount: payload.principal_amount,
          interest_rate: payload.interest_rate,
          interest_rate_type: payload.interest_rate_type,
          interest_calc_method: payload.interest_calc_method,
          start_date: payload.start_date,
          maturity_date: payload.maturity_date,
          payment_type: payload.payment_type,
          ...(payload.schedules?.length ? { schedules: payload.schedules } : {}),
          ...(payload.note ? { note: payload.note } : {}),
        },
        false,
        true
      );
    } catch (error) {
      console.error("[paybookRepository] Error creating loan:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin sổ nợ
   * workflowid: WF_MB_UPDATE_LOAN
   */
  async updateLoan(payload: UpdateLoanPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_UPDATE_LOAN,
        {
          id: payload.id,
          counterparty_name: payload.counterparty_name,
          counterparty_type: payload.counterparty_type,
          description: payload.description,
          principal_amount: payload.principal_amount,
          balance: payload.balance,
          interest_rate: payload.interest_rate,
          interest_rate_type: payload.interest_rate_type,
          interest_calc_method: payload.interest_calc_method,
          start_date: payload.start_date,
          maturity_date: payload.maturity_date,
          status: payload.status,
          payment_type: payload.payment_type,
          total_installments: payload.total_installments ?? null,
          note: payload.note ?? "",
        },
        false,
        true
      );
    } catch (error) {
      console.error("[paybookRepository] Error updating loan:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sổ nợ
   * workflowid: WF_MB_GET_LIST_LOAN
   */
  async getLoans(): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_LIST_LOAN,
        {},
        false,
        true
      );
    } catch (error) {
      console.error("[paybookRepository] Error fetching loans:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết sổ nợ
   * workflowid: WF_MB_GET_LOAN
   */
  async getLoan(loanId: number): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_LOAN,
        { loan_id: loanId },
        false,
        true
      );
    } catch (error) {
      console.error("[paybookRepository] Error fetching loan detail:", error);
      throw error;
    }
  },

  /**
   * Tìm kiếm / lọc danh sách sổ nợ
   * workflowid: WF_MB_ADVANCED_SEARCH_LOAN
   */
  async searchLoans(payload: SearchLoanPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_ADVANCED_SEARCH_LOAN,
        {
          loan_type: payload.loan_type ?? null,
          status: payload.status ?? null,
          page_index: payload.page_index,
          page_size: payload.page_size,
        },
        false,
        true
      );
    } catch (error) {
      console.error("[paybookRepository] Error searching loans:", error);
      throw error;
    }
  },
};
