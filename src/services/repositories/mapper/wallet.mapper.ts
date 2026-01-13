import { WalletRaw, WalletSummary } from "@/types/wallet";

export const mapWalletToSummary = (w: WalletRaw): WalletSummary => ({
  walletId: String(w.wallet_id),
  name: w.wallet_name,
  type: w.wallet_type as WalletSummary["type"],

  balance: w.available_balance,
  currency: w.default_currency,

  icon: w.icon,
  color: w.color,

  status: w.status as WalletSummary["status"],
});
