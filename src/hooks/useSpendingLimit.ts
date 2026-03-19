import StorageKey from '@/constants/StorageKey';
import { CreateSpendingLimitPayload, SpendingLimit, spendingLimitRepository } from '@/services/repositories/spendingLimit.repository';
import StorageService from '@/services/StorageService';
import { useCallback, useEffect, useState } from 'react';

// Global shared state for spending limits
let globalLimits: SpendingLimit[] = [];
let isInitialized = false;
const listeners: Array<(limits: SpendingLimit[]) => void> = [];

const notifyListeners = (newLimits: SpendingLimit[]) => {
  globalLimits = newLimits;
  listeners.forEach(listener => listener(newLimits));
};

let globalAdvancedLimits: SpendingLimit[] = [];
let isAdvancedInitialized = false;
const advancedListeners: Array<(limits: SpendingLimit[]) => void> = [];

const notifyAdvancedListeners = (newLimits: SpendingLimit[]) => {
  globalAdvancedLimits = newLimits;
  advancedListeners.forEach(listener => listener(newLimits));
};

export const useSpendingLimit = () => {
  const [limits, setLimits] = useState<SpendingLimit[]>(globalLimits);
  const [advancedLimits, setAdvancedLimits] = useState<SpendingLimit[]>(globalAdvancedLimits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add listener to update local state when global state changes
    const listener = (newLimits: SpendingLimit[]) => setLimits(newLimits);
    const advListener = (newLimits: SpendingLimit[]) => setAdvancedLimits(newLimits);
    
    listeners.push(listener);
    advancedListeners.push(advListener);

    // Initialize from Storage if not already done
    if (!isInitialized) {
      isInitialized = true;
      StorageService.getItem(StorageKey.spendingWarningList).then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            notifyListeners(parsed);
          } catch (e) {
            console.error('[useSpendingLimit] Cache parse error:', e);
          }
        }
      });
    }

    if (!isAdvancedInitialized) {
      isAdvancedInitialized = true;
      StorageService.getItem(StorageKey.spendingWarningList + '_advanced').then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            notifyAdvancedListeners(parsed);
          } catch (e) {
            console.error('[useSpendingLimit] Adv cache parse error:', e);
          }
        }
      });
    }

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
      
      const advIndex = advancedListeners.indexOf(advListener);
      if (advIndex > -1) advancedListeners.splice(advIndex, 1);
    };
  }, []);

  const fetchLimits = useCallback(async (contractNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await spendingLimitRepository.getSpendingLimits(contractNumber);
      if (response.isSuccess()) {
        const rawData = response.data?.items || response.data?.data || [];
        const data = rawData.map((item: any) => ({
          ...item,
          spending_limit_id: item.spending_limit_id || (item.id ? Number(item.id) : undefined)
        }));

        notifyListeners(data);
        await StorageService.setItem(StorageKey.spendingWarningList, JSON.stringify(data));

        return data;
      } else {
        throw new Error(response.getError());
      }
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdvancedLimits = useCallback(async (contractNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await spendingLimitRepository.advancedSearchSpendingLimit({
        contract_number: contractNumber,
        period: null,
        is_active: true,
        page_index: 0,
        page_size: 10,
      });
      if (response.isSuccess()) {
        const rawData = response.data?.items || response.data?.data || [];
        const data = rawData.map((item: any) => ({
          ...item,
          spending_limit_id: item.spending_limit_id || (item.id ? Number(item.id) : undefined)
        }));

        notifyAdvancedListeners(data);
        await StorageService.setItem(StorageKey.spendingWarningList + '_advanced', JSON.stringify(data));

        return data;
      } else {
        throw new Error(response.getError());
      }
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createLimit = useCallback(async (payload: CreateSpendingLimitPayload, useAdvancedRefresh?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await spendingLimitRepository.createSpendingLimit(payload);
      if (response.isSuccess()) {
        if (useAdvancedRefresh) {
          await fetchAdvancedLimits(payload.contract_number);
        } else {
          await fetchLimits(payload.contract_number);
        }
        return { success: true };
      } else {
        throw new Error(response.getError());
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchLimits, fetchAdvancedLimits]);

  const updateLimit = useCallback(async (payload: any, contractNumber: string, useAdvancedRefresh?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await spendingLimitRepository.updateSpendingLimit(payload);
      if (response.isSuccess()) {
        if (useAdvancedRefresh) {
          await fetchAdvancedLimits(contractNumber);
        } else {
          await fetchLimits(contractNumber);
        }
        return { success: true };
      } else {
        throw new Error(response.getError());
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchLimits, fetchAdvancedLimits]);

  const deleteLimit = useCallback(async (spendingLimitId: number, contractNumber: string, useAdvancedRefresh?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await spendingLimitRepository.deleteSpendingLimit(spendingLimitId);
      if (response.isSuccess()) {
        if (useAdvancedRefresh) {
          await fetchAdvancedLimits(contractNumber);
        } else {
          await fetchLimits(contractNumber);
        }
        return { success: true };
      } else {
        throw new Error(response.getError());
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchLimits, fetchAdvancedLimits]);

  /**
   * Helper to check if a transaction of a certain amount exceeds a limit for a period
   */
  const getLimitsByPeriod = useCallback((period: string) => {
    return limits.find(l => l.period.toLowerCase() === period.toLowerCase() && l.is_active !== false);
  }, [limits]);

  /**
   * Helper to check if a transaction of a certain amount exceeds any active limits.
   * Uses `limits` (React state) instead of `globalLimits` to avoid stale closure.
   * Hỗ trợ cross-currency: nếu `convertFn` được truyền vào, sẽ convert amount
   * sang currency của từng limit trước khi so sánh.
   * Returns an array of limits that would be exceeded.
   */
  const checkTransactionLimit = useCallback(
    (
      amount: number,
      currency: string,
      convertFn?: (amount: number, from: string, to: string) => number | null
    ) => {
      return limits.filter(l => {
        if (l.is_active === false) return false;

        let comparableAmount = amount;

        // Nếu currency khác với limit → cần convert
        if (l.currency_code !== currency) {
          if (!convertFn) return false; // Không có hàm convert thì bỏ qua
          const converted = convertFn(amount, currency, l.currency_code);
          if (converted === null) return false; // Không có tỷ giá thì bỏ qua
          comparableAmount = converted;
        }

        return (comparableAmount + (l.used_amount || 0)) > l.limit_amount;
      });
    },
    [limits]
  );

  return {
    limits,
    advancedLimits,
    loading,
    error,
    fetchLimits,
    createLimit,
    updateLimit,
    deleteLimit,
    getLimitsByPeriod,
    checkTransactionLimit,
    fetchAdvancedLimits,
  };
};