// src/hooks/useDefaultCurrency.ts

import DefaultCurrencyService, { DefaultCurrency } from '@/services/DefaultCurrencyService';
import { useEffect, useState } from 'react';

export const useDefaultCurrency = () => {
  const [defaultCurrency, setDefaultCurrency] = useState<DefaultCurrency>({
    currencyId: 'VND',
    symbol: 'đ',
    name: 'Vietnamese Dong',
  });
  const [loading, setLoading] = useState(true);

  /**
   * Load default currency from storage
   */
  const loadDefaultCurrency = async () => {
    try {
      setLoading(true);
      const currency = await DefaultCurrencyService.getDefaultCurrency();
      setDefaultCurrency(currency);
    } catch (error) {
      console.error('[useDefaultCurrency] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update default currency
   */
  const updateDefaultCurrency = async (currency: DefaultCurrency) => {
    try {
      await DefaultCurrencyService.setDefaultCurrency(currency);
      setDefaultCurrency(currency);
      console.log('[useDefaultCurrency] Updated to:', currency);
    } catch (error) {
      console.error('[useDefaultCurrency] Failed to update:', error);
      throw error;
    }
  };

  /**
   * Reset to VND
   */
  const resetToDefault = async () => {
    try {
      await DefaultCurrencyService.resetToDefault();
      const currency = await DefaultCurrencyService.getDefaultCurrency();
      setDefaultCurrency(currency);
      console.log('[useDefaultCurrency] Reset to VND');
    } catch (error) {
      console.error('[useDefaultCurrency] Failed to reset:', error);
      throw error;
    }
  };

  // Load on mount
  useEffect(() => {
    loadDefaultCurrency();
  }, []);

  return {
    defaultCurrency,
    loading,
    updateDefaultCurrency,
    resetToDefault,
    refresh: loadDefaultCurrency,
  };
};