export type WalletType = "FIAT" | "TRACKER" | "DEFI";

export type WalletStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export interface WalletSummary {
  walletId: string;
  name: string;
  type: WalletType;

  balance: number;
  currency: string;

  icon?: string;
  color?: string;

  status: WalletStatus;
}


export interface WalletRaw {
  wallet_id: string;
  contract_number: string;
  user_code: string;
  wallet_name: string;
  wallet_type: string;
  icon: string;
  color: string;
  default_currency: string;
  available_balance: number;
  status: string;
}