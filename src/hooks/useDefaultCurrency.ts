// src/hooks/useDefaultCurrency.ts

import { GlobalContext } from "@/contexts/GlobalContext";
import {
  currencyCache,
  fetchCurrenciesFromApi,
  useCurrency
} from "@/hooks/useCurrency";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import { Currency } from "@/services/repositories/currency.repository";
import { useCallback, useContext, useEffect, useState } from "react";

export interface DefaultCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

export const useDefaultCurrency = () => {
  const { appInfo } = useContext(GlobalContext);
  const [defaultCurrency, setDefaultCurrency] = useState<DefaultCurrency>({
    currencyId: "VND",
    symbol: "₫",
    name: "Vietnamese Dong",
  });
  const [loading, setLoading] = useState(true);

  // Hook useCurrency để có cache sẵn
  const { currencies, parseCurrencyName } = useCurrency({
    autoFetch: true,
    pageSize: 100,
  });

  /**
   * Tìm currency theo code trong cache hoặc danh sách đã load
   */
  const findCurrencyByCode = useCallback((code: string): Currency | null => {
    // 1. Tìm trong cache trước
    if (currencyCache.data?.currencies) {
      const found = currencyCache.data.currencies.find(
        c => c.currency_id === code
      );
      if (found) return found;
    }

    // 2. Tìm trong danh sách đã load (từ hook)
    const found = currencies.find(c => c.currency_id === code);
    return found || null;
  }, [currencies]);

  /**
   * Convert Currency object sang DefaultCurrency
   */
  const convertToDefaultCurrency = useCallback((currency: Currency): DefaultCurrency => {
    return {
      currencyId: currency.currency_id,
      symbol: currency.symbol || "₫",
      name: parseCurrencyName(currency),
    };
  }, [parseCurrencyName]);

  /**
   * Load currency từ AppInfo
   */
  useEffect(() => {
    const loadDefaultCurrency = async () => {
      try {
        setLoading(true);

        // 1. Lấy currency code từ AppInfo
        const currencyCode = appInfo?.currency_code || "VND";

        // 2. Tìm trong cache/loaded currencies
        let currency = findCurrencyByCode(currencyCode);

        // 3. Nếu không có, gọi API để tìm
        if (!currency) {
          console.log(`[useDefaultCurrency] Currency ${currencyCode} not in cache, fetching...`);
          
          try {
            const result = await fetchCurrenciesFromApi(currencyCode, 0, 10, false);
            
            // Tìm exact match
            currency = result.currencies.find(
              c => c.currency_id === currencyCode
            ) || null;

            if (!currency && result.currencies.length > 0) {
              // Fallback to first result if no exact match
              currency = result.currencies[0];
            }
          } catch (apiError) {
            console.error("[useDefaultCurrency] API call failed:", apiError);
          }
        }

        // 4. Set default currency
        if (currency) {
          const defaultCurr = convertToDefaultCurrency(currency);
          setDefaultCurrency(defaultCurr);
        } else {
          // Fallback to VND if all failed
          console.warn(`[useDefaultCurrency] Could not find ${currencyCode}, using VND`);
          setDefaultCurrency({
            currencyId: "VND",
            symbol: "₫",
            name: "Vietnamese Dong",
          });
        }
      } catch (error) {
        console.error("[useDefaultCurrency] Failed to load:", error);
        // Keep existing defaultCurrency (VND)
      } finally {
        setLoading(false);
      }
    };

    // Chỉ load khi có appInfo
    if (appInfo?.currency_code) {
      loadDefaultCurrency();
    } else {
      setLoading(false);
    }
  }, [appInfo?.currency_code, findCurrencyByCode, convertToDefaultCurrency]);

  /**
   * Listen for currency changes from CurrencyEventEmitter
   */
  useEffect(() => {
    const handleCurrencyChanged = async (currencyId: string) => {
      try {
        // Tìm currency mới trong cache
        const currency = findCurrencyByCode(currencyId);
        
        if (currency) {
          const newDefaultCurr = convertToDefaultCurrency(currency);
          setDefaultCurrency(newDefaultCurr);
        } else {
          // Nếu không có, gọi API
          const result = await fetchCurrenciesFromApi(currencyId, 0, 10, false);
          const found = result.currencies.find(c => c.currency_id === currencyId);
          
          if (found) {
            const newDefaultCurr = convertToDefaultCurrency(found);
            setDefaultCurrency(newDefaultCurr);
          }
        }
      } catch (error) {
        console.error("[useDefaultCurrency] Failed to handle currency change:", error);
      }
    };

    CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);
    return () => {
      CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
    };
  }, [findCurrencyByCode, convertToDefaultCurrency]);

  /**
   * Update default currency (emit event để các component khác biết)
   */
  const updateDefaultCurrency = useCallback(
    async (currency: DefaultCurrency) => {
      try {
        // Update local state
        setDefaultCurrency(currency);

        // Emit event để notify các component khác
        CurrencyEventEmitter.emitCurrencyChanged(currency.currencyId);

        // NOTE: Không save vào storage vì appInfo.currency_code là source of truth
        // Nếu cần persist, phải update lên server (API update user settings)
      } catch (error) {
        console.error("[useDefaultCurrency] Failed to update:", error);
        throw error;
      }
    },
    []
  );

  return {
    defaultCurrency,
    loading,
    updateDefaultCurrency,
  };
};