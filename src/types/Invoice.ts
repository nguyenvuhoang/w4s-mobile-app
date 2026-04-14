import { RecurringType } from "@/components/modals/BottomRecurringModal";

export interface InvoiceRecurring {
  type: RecurringType | "None";
  count: number | null;
  is_forever: boolean;
  selected_days: number[] | null;
}

export interface CreateInvoicePayload {
  wallet_id: number | null;
  account_number: string;
  category_id: number;
  payment_transaction_type: string;
  bill_name: string;
  business_type: string | null;
  recurring: InvoiceRecurring;
  amount: number;
  currency_code: string;
  due_at_utc: string;
  note: string;
  contract_number: string;
}

export interface Invoice {
  id?: number;
  wallet_id: number;
  account_number: string;
  category_id: number;
  bill_name: string;
  business_type: string | null;
  amount: number;
  currency_code: string;
  due_at_utc: string;
  note: string;
  recurring_type: string;
  recurring_count: number | null;
  is_forever: boolean;
  status: string;
}

export interface SimpleSearchInvoicePayload {
  search_text: string;
  page_index: number;
  page_size: number;
}

export interface AdvancedSearchInvoicePayload {
  user_code?: string;
  wallet_id?: number | null;
  business_type?: string | null;
  schedule_type?: string | null;
  status?: string | null;
  from_due_at_utc?: string | null;
  to_due_at_utc?: string | null;
  page_index: number;
  page_size: number;
}

export interface UpdateInvoicePayload {
  id: number;
  wallet_id: number | null;
  account_number: string;
  category_id: number;
  payment_transaction_type: string;
  bill_name: string;
  business_type: string | null;
  recurring: InvoiceRecurring;
  amount: number;
  currency_code: string;
  due_at_utc: string;
  note: string;
  contract_number: string;
}
