// src/hooks/useDefaultCurrency.ts

import { GlobalContext } from "@/contexts/GlobalContext";
import {
  currencyCache,
  fetchCurrenciesFromApi,
  useCurrency
} from "@/hooks/useCurrency";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { useCallback, useContext, useEffect, useState } from "react";

export interface DefaultCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

/**
 * Hook to manage the application's default currency.
 * Source of truth is appInfo.currency_code from GlobalContext.
 */
export const useDefaultCurrency = () => {
  const { appInfo } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  
  // Local state as a fallback/buffer for the derived currency info
  const [localCurrency, setLocalCurrency] = useState<DefaultCurrency>({
    currencyId: appInfo?.currency_code || "VND",
    symbol: "₫",
    name: "Vietnamese Dong",
  });

  const { parseCurrencyName } = useCurrency({ autoFetch: false });

  /**
   * Resolve a currency from cache or API
   */
  const resolveCurrency = useCallback(async (code: string) => {
    // 1. Check cache first
    const cache = currencyCache.data;
    let currency = cache?.currencies?.find(c => c.currency_id === code) || null;

    // 2. Fetch if not in cache
    if (!currency) {
      try {
        const result = await fetchCurrenciesFromApi(code, 0, 10);
        currency = result.currencies.find(c => c.currency_id === code) || 
                  (result.currencies.length > 0 ? result.currencies[0] : null);
      } catch (err) {
        console.error("[useDefaultCurrency] Fetch failed:", err);
      }
    }

    if (currency) {
      setLocalCurrency({
        currencyId: currency.currency_id,
        symbol: currency.symbol || "₫",
        name: parseCurrencyName(currency),
      });
    }
  }, [parseCurrencyName]);

  // Sync whenever appInfo.currency_code changes
  useEffect(() => {
    const code = appInfo?.currency_code || "VND";
    resolveCurrency(code);
  }, [appInfo?.currency_code, resolveCurrency]);

  // Also listen for manual events (e.g. from picker before appInfo updates)
  useEffect(() => {
    const handleCurrencyChanged = (currencyId: string) => {
      resolveCurrency(currencyId);
    };

    CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);
    return () => CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
  }, [resolveCurrency]);

  /**
   * Update the default currency globally
   */
  const updateDefaultCurrency = useCallback(async (currency: DefaultCurrency) => {
    setLocalCurrency(currency);
    CurrencyEventEmitter.emitCurrencyChanged(currency.currencyId);
    // Note: We expect the caller to also update the server/appInfo
  }, []);

  return {
    defaultCurrency: localCurrency,
    loading,
    updateDefaultCurrency,
  };
};