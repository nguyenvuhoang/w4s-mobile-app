import StorageKey from '@/constants/StorageKey';
import { financeSummaryRepository } from '@/services/repositories/financeSummary.repository';
import StorageService from '@/services/StorageService';
import { useCallback, useState } from 'react';

export interface DebitSummaryItem {
  label: string;
  amount: number;
}

export const useReport = () => {
  const [debitSummary, setDebitSummary] = useState<DebitSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyDebitSummary = useCallback(async (params: {
    wallet_id: number;
    anchor_date: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
      const response = await financeSummaryRepository.getMonthlyDebitSummary({
        ...params,
        usercode: userCode?.toString() || '',
      });

      if (response.isSuccess() && response.data) {
        setDebitSummary(response.data.debit_summary || []);
      } else {
        throw new Error(response.message || 'Failed to fetch monthly debit summary');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch monthly debit summary';
      setError(msg);
      console.error('[useReport] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    debitSummary,
    loading,
    error,
    fetchMonthlyDebitSummary,
  };
};
