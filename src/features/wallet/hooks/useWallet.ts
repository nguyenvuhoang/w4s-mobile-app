import { GlobalContext } from "@/contexts/GlobalContext";
import { WalletSummary } from "@/types/wallet";
import { useContext } from "react";

interface UseWalletResult {
  wallets: WalletSummary[];
  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;

  // helpers
  getWalletById: (walletId: number) => WalletSummary | undefined;
  getWalletsByType: (type: WalletSummary["type"]) => WalletSummary[];

  // balance
  updateWalletBalance: (walletId: number, diff: number) => void;

  // default wallet
  defaultWalletId: number | null;
  defaultWallet?: WalletSummary;
  setDefaultWalletId: (walletId: number | null) => void;
  setPrimaryWallet: (walletId: number) => Promise<void>;
}

export const useWallet = (): UseWalletResult => {
  const {
    wallets,
    walletLoading,
    walletError,
    fetchWallets,
    updateWalletBalance,

    // default wallet
    defaultWalletId,
    defaultWallet,
    setDefaultWalletId,
    setPrimaryWallet,
  } = useContext(GlobalContext);

  const refresh = () => fetchWallets(true);

  const getWalletById = (walletId: number) =>
    wallets.find((w) => w.walletId === walletId);

  const getWalletsByType = (type: WalletSummary["type"]) =>
    wallets.filter((w) => w.type === type);

  return {
    wallets,
    loading: walletLoading,
    error: walletError,

    refresh,
    getWalletById,
    getWalletsByType,

    updateWalletBalance,

    defaultWalletId,
    defaultWallet,
    setDefaultWalletId,
    setPrimaryWallet,
  };
};
