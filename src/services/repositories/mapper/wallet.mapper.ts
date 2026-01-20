// mapper/wallet.mapper.ts
import {
  AccountRaw,
  WalletAccount,
  WalletRaw,
  WalletSummary,
} from "@/types/wallet";

const mapAccountToSummary = (acc: AccountRaw): WalletAccount => ({
  id: acc.id,
  accountNumber: acc.account_number,
  accountType: acc.account_type as WalletAccount["accountType"],
  accountTypeCaption: acc.account_type_caption,
  currencyCode: acc.currency_code,
  isPrimary: acc.is_primary,
  status: acc.status,
  balance: acc.balance,
});

export const mapWalletToSummary = (w: WalletRaw): WalletSummary => ({
  walletId: w.wallet_id,
  name: w.wallet_name,
  type: w.wallet_type as WalletSummary["type"],

  balance: w.available_balance,
  currency: w.default_currency,

  icon: w.icon,
  color: w.color,

  status: w.status as WalletSummary["status"],

  accounts: w.account?.map(mapAccountToSummary) || [],
});
