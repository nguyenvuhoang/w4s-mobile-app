import { GlobalContext } from "@/contexts/GlobalContext";
import { WalletSummary } from "@/types/wallet";
import { NavigationContext } from "@react-navigation/native";
import { useCallback, useContext, useEffect } from "react";

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
  getPrimaryWallet: () => Promise<WalletSummary>;
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
    getPrimaryWallet,
  } = useContext(GlobalContext);

  const navigation = useContext(NavigationContext);

  useEffect(() => {
    if (!navigation) return;
    return navigation.addListener("focus", () => {
      fetchWallets(false);
    });
  }, [navigation, fetchWallets]);

  const refresh = useCallback(() => fetchWallets(true), [fetchWallets]);

  const getWalletById = useCallback(
    (walletId: number) => wallets.find((w) => w.walletId === walletId),
    [wallets]
  );

  const getWalletsByType = useCallback(
    (type: WalletSummary["type"]) => wallets.filter((w) => w.type === type),
    [wallets]
  );

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
    getPrimaryWallet,
  };
};
