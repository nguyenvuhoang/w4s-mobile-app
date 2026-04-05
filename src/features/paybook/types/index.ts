// ─── Loan Types (match server enum) ─────────────────────────────────────────

export type LoanType = "LEND" | "BORROW";
// LEND   = Cho vay  (mình là chủ nợ)
// BORROW = Đi vay   (mình là con nợ)

export type CounterpartyType = "INDIVIDUAL" | "MERCHANT";

export type InterestRateType = "FIXED" | "FLOATING";

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

// ─── Search payload ───────────────────────────────────────────────────────────

export interface SearchLoanPayload {
  loan_type?: LoanType | null;
  status?: LoanStatus | null;
  page_index: number;
  page_size: number;
}
