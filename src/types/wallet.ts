export type WalletType = "FIAT" | "TRACKER" | "DEFI";

export type WalletStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export type AccountType = "01" | "02" | "03"; // Income, Expense, Loan

export interface WalletAccount {
  id: number;
  accountNumber: string;
  accountType: AccountType;
  accountTypeCaption: string;
  currencyCode: string;
  isPrimary: boolean;
  status: string;
  balance: number | null;
}

export interface WalletSummary {
  walletId: number;
  name: string;
  type: WalletType;

  balance: number;
  currency: string;

  icon?: string;
  color?: string;

  status: WalletStatus;

  // Thêm accounts
  accounts: WalletAccount[];
}

export interface AccountRaw {
  id: number;
  wallet_id: number;
  account_number: string;
  account_type: string;
  account_type_caption: string;
  currency_code: string;
  is_primary: boolean;
  status: string;
  status_caption: string | null;
  balance: number | null;
}

export interface WalletRaw {
  wallet_id: number;
  contract_number: string;
  user_code: string;
  wallet_name: string;
  wallet_type: string;
  icon: string;
  color: string;
  default_currency: string;
  available_balance: number;
  status: string;
  account: AccountRaw[];
}
