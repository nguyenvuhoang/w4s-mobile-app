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
  business_type: string;
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
  business_type: string;
  amount: number;
  currency_code: string;
  due_at_utc: string;
  note: string;
  recurring_type: string;
  recurring_count: number | null;
  is_forever: boolean;
  status: string;
}
