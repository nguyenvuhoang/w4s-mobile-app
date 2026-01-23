// src/hooks/useDefaultCurrency.ts

import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import DefaultCurrencyService, {
  DefaultCurrency,
} from "@/services/DefaultCurrencyService";
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
        console.log("[useDefaultCurrency] Initial load:", currency);
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
      console.log(
        "[useDefaultCurrency] Received currency changed event:",
        currencyId,
      );

      // Reload from storage
      try {
        const currency = await DefaultCurrencyService.getDefaultCurrency();
        console.log("[useDefaultCurrency] Reloaded from storage:", currency);
        setDefaultCurrency(currency);
      } catch (error) {
        console.error("[useDefaultCurrency] Failed to reload:", error);
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
        console.log("[useDefaultCurrency] Updating to:", currency);

        // Save to storage
        await DefaultCurrencyService.setDefaultCurrency(currency);

        // Update local state
        setDefaultCurrency(currency);

        // Emit event to notify other components/hooks
        CurrencyEventEmitter.emitCurrencyChanged(currency.currencyId);

        console.log("[useDefaultCurrency] Updated successfully");
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
