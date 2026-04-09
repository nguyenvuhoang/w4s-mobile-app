// ─── Loan Types (match server enum) ─────────────────────────────────────────

export type LoanType = "LEND" | "BORROW";

export type CounterpartyType = "INDIVIDUAL" | "MERCHANT";

export type InterestRateType = "FIXED";

export type InterestCalcMethod = "REDUCING" | "FLAT";

export type PaymentType = "INSTALLMENT" | "BULLET";

export type LoanStatus = "ACTIVE" | "COMPLETED" | "OVERDUE" | "CANCELLED";

// ─── Loan (item trong danh sách) ─────────────────────────────────────────────

export interface Loan {
  loan_id: string;
  wallet_id: number;
  loan_type: LoanType;
  counterparty_name: string;
  counterparty_type: CounterpartyType;
  loan_description?: string;
  currency_code: string;
  loan_limit: number;
  principal_amount: number;
  paid_amount: number;
  remaining_amount: number;
  interest_rate: number;
  interest_rate_type: InterestRateType;
  interest_calc_method: InterestCalcMethod;
  payment_type: PaymentType;
  total_installments?: number;
  paid_installments?: number;
  start_date: string;        // ISO 8601
  maturity_date: string;     // ISO 8601
  status: LoanStatus;
  note?: string;
  created_at: string;
  updated_at: string;
}

// ─── Summary card ─────────────────────────────────────────────────────────────

export interface LoanSummary {
  total_lend: number;     // Tổng cho vay
  total_borrow: number;   // Tổng đi vay
  net_balance: number;    // Chênh lệch (lend - borrow)
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export type LoanFilterType = "ALL" | "LEND" | "BORROW";

// ─── Schedule Status ──────────────────────────────────────────────────────────

export type ScheduleStatus = "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";

// ─── Loan Schedule (lịch thanh toán từng kỳ) ─────────────────────────────────

export interface LoanSchedule {
  id: number;
  schedule_no: string;
  installment_no: number;
  from_date: string;           // ISO 8601
  to_date: string;             // ISO 8601
  due_date: string;            // ISO 8601
  opening_balance: number;
  principal_due_amount: number;
  interest_due_amount: number;
  paid_principal_amount: number;
  paid_interest_amount: number;
  closing_balance: number;
  interest_rate: number;
  status: ScheduleStatus;
  paid_date: string | null;
  payment_ref_no: string | null;
  note: string;
}

// ─── Loan Detail (chi tiết sổ nợ + schedules) ────────────────────────────────

export interface LoanDetail {
  id: number;
  loan_no: string;
  user_code: string;
  wallet_id: number;
  contract_number: string;
  loan_type: LoanType;
  counterparty_name: string;
  counterparty_type: CounterpartyType;
  description: string;
  principal_amount: number;
  balance: number;
  interest_rate: number;
  interest_rate_type: InterestRateType;
  interest_calc_method: InterestCalcMethod;
  start_date: string;          // ISO 8601
  maturity_date: string;       // ISO 8601
  status: LoanStatus;
  payment_type: PaymentType;
  total_installments: number;
  note?: string;
  schedules: LoanSchedule[];
}

// ─── Search payload ───────────────────────────────────────────────────────────

export interface SearchLoanPayload {
  loan_type?: LoanType | null;
  status?: LoanStatus | null;
  page_index: number;
  page_size: number;
}
