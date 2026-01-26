// src/hooks/useDefaultCurrency.ts

import STORAGE_KEY from "@/constants/StorageKey";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import DefaultCurrencyService, {
    DefaultCurrency,
} from "@/services/DefaultCurrencyService";
import StorageService from "@/services/StorageService";
import { useCallback, useEffect, useState } from "react";

export const useDefaultCurrency = () => {
  const [defaultCurrency, setDefaultCurrency] = useState<DefaultCurrency>({
    currencyId: "VND",
    symbol: "₫",
    name: "Vietnamese Dong",
  });
  const [loading, setLoading] = useState(true);

  // Load initial currency
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const currency = await DefaultCurrencyService.getDefaultCurrency();

        setDefaultCurrency(currency);
      } catch (error) {
        console.error("[useDefaultCurrency] Failed to load:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, []);

  // Listen for currency changes from other components
  useEffect(() => {
    const handleCurrencyChanged = async (currencyId: string) => {
      // Only read from local storage to avoid duplicate API call
      // The currency was already saved to storage by updateDefaultCurrency()
      try {
        const storedCurrencyStr = await StorageService.getItem(STORAGE_KEY.defaultCurrency);
        if (storedCurrencyStr) {
          const currency = JSON.parse(storedCurrencyStr) as DefaultCurrency;
          setDefaultCurrency(currency);
        }
      } catch (error) {
        console.error("[useDefaultCurrency] Failed to reload from storage:", error);
      }
    };

    CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);

    return () => {
      CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
    };
  }, []);

  /**
   * Update default currency
   * @param currency - New currency to set as default
   */
  const updateDefaultCurrency = useCallback(
    async (currency: DefaultCurrency) => {
      try {


        // Save to storage
        await DefaultCurrencyService.setDefaultCurrency(currency);

        // Update local state
        setDefaultCurrency(currency);

        // Emit event to notify other components/hooks
        CurrencyEventEmitter.emitCurrencyChanged(currency.currencyId);


      } catch (error) {
        console.error("[useDefaultCurrency] Failed to update:", error);
        throw error;
      }
    },
    [],
  );

  return {
    defaultCurrency,
    loading,
    updateDefaultCurrency,
  };
};
