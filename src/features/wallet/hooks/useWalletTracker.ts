import StorageKey from '@/constants/StorageKey';
import { walletTrackerRepository } from '@/services/repositories/walletTracker.repository';
import StorageService from '@/services/StorageService';
import { useState } from 'react';

interface CreateWalletTrackerParams {
  walletName: string;
  currency: string;
  color: string;
  icon: string;
  isIncludeReport: boolean;
  amount : number;
  walletType: string;
}

export const useWalletTracker = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWalletTracker = async (params: CreateWalletTrackerParams) => {
    setLoading(true);
    setError(null);

    try {
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
      if (!userCode) {
        throw new Error('Missing user code');
      }

      const response = await walletTrackerRepository.createWalletTracker(
        String(userCode),
        params.walletName,
        params.currency,
        params.color,
        params.icon,
        params.isIncludeReport,
        params.amount,
        params.walletType
      );

      if (!response.isSuccess()) {
        throw new Error(response.getError() || response.message || 'Create wallet failed');
      }

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Create wallet failed';
      setError(message);
      console.error('[useWalletTracker] createWalletTracker failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createWalletTracker,
  };
};