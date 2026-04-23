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
  amount: number;
  walletType: string;
}

interface UpdateWalletProfileParams {
  wallet_id: number;
  wallet_balance: number;
  wallet_name: string;
  wallet_type: string;
  default_currency: string;
  is_primary: boolean;
  status: string;
  icon: string | null;
  color: string | null;
}

export const useWalletTracker = () => {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWalletTracker = async (params: CreateWalletTrackerParams) => {
    setLoading(true);
    setError(null);

    try {
      const userCode = await StorageService.getItem(StorageKey.userCode);
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

  const deleteWalletTracker = async (walletId: number, confirm: boolean = false): Promise<any> => {
    setDeleting(true);
    setError(null);

    try {
      const userCode = await StorageService.getItem(StorageKey.userCode);
      if (!userCode) {
        throw new Error('Missing user code');
      }

      const response = await walletTrackerRepository.deleteWalletTracker(
        String(userCode),
        walletId,
        confirm
      );

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete wallet failed';
      setError(message);
      console.error('[useWalletTracker] deleteWalletTracker failed', err);
      return null;
    } finally {
      setDeleting(false);
    }
  };

  const updateWalletProfile = async (params: UpdateWalletProfileParams): Promise<any> => {
    setUpdating(true);
    setError(null);

    try {
      const response = await walletTrackerRepository.updateWalletProfile(params);

      if (!response.isSuccess()) {
        throw new Error(response.getError() || response.message || 'Update wallet failed');
      }

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update wallet failed';
      setError(message);
      console.error('[useWalletTracker] updateWalletProfile failed', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    loading,
    deleting,
    updating,
    error,
    createWalletTracker,
    deleteWalletTracker,
    updateWalletProfile,
  };
};
