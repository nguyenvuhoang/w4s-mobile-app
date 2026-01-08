import { GlobalContext } from "@/contexts/GlobalContext";
import {
    Wallet,
    walletTrackerRepository,
} from "@/services/repositories/walletTracker.repository";
import { useContext, useEffect, useState } from "react";
GlobalContext;

interface UseWalletOptions {
  autoFetch?: boolean;
}

export const useWalletTracker = (options: UseWalletOptions = {}) => {
  const { appInfo } = useContext(GlobalContext);
  const { autoFetch = true } = options;

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = async () => {
    setLoading(true);
    setError(null);

    try {
      const userCode = appInfo?.user_code;
      if (!userCode) throw "Can't get user Code form Appin";
      const response = await walletTrackerRepository.getWalletList(userCode);
      if (response.isSuccess() && response.data) {
        const walletData = response.data.items || [];
        setWallets(walletData);
      } else {
        throw new Error(response.message || "Failed to fetch wallets");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch wallets";
      setError(errorMessage);
      console.error("[useWallet] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchWallets();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchWallets();
    } else {
      console.log(
        "[useWallet] NOT calling fetchWallets. autoFetch:",
        autoFetch
      );
    }
  }, [autoFetch]);

  return {
    wallets,
    loading,
    error,
    refetch,
  };
};
