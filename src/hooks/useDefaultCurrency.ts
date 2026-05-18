import StorageKey from "@/constants/StorageKey";
import { GlobalContext } from "@/contexts/GlobalContext";
import { currencyCache, fetchCurrenciesFromApi, useCurrency } from "@/hooks/useCurrency";
import CurrencyEventEmitter from "@/services/CurrencyEventEmitter";
import StorageService from "@/services/StorageService";
import { useCallback, useContext, useEffect, useState } from "react";

export interface DefaultCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

export const useDefaultCurrency = () => {
  const { appInfo, setAppInfo } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  const [localCurrency, setLocalCurrency] = useState<DefaultCurrency>({
    currencyId: appInfo?.currency_code || "VND",
    symbol: "₫",
    name: "Vietnamese Dong",
  });

  const { parseCurrencyName } = useCurrency({ autoFetch: false });

  const resolveCurrency = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const cache = currencyCache.data;
      let currency = cache?.currencies?.find(c => c.currency_id === code) || null;

      if (!currency) {
        const result = await fetchCurrenciesFromApi(code, 0, 10);
        currency = result.currencies.find(c => c.currency_id === code) ||
          (result.currencies.length > 0 ? result.currencies[0] : null);
      }

      if (currency) {
        setLocalCurrency({
          currencyId: currency.currency_id,
          symbol: currency.symbol || "₫",
          name: parseCurrencyName(currency),
        });
      }
    } catch (err) {
      console.error("[useDefaultCurrency] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [parseCurrencyName]);

  useEffect(() => {
    const code = appInfo?.currency_code || "VND";
    resolveCurrency(code);
  }, [appInfo?.currency_code, resolveCurrency]);

  useEffect(() => {
    const handleCurrencyChanged = (currencyId: string) => {
      resolveCurrency(currencyId);
    };

    CurrencyEventEmitter.onCurrencyChanged(handleCurrencyChanged);
    return () => CurrencyEventEmitter.offCurrencyChanged(handleCurrencyChanged);
  }, [resolveCurrency]);

  const updateDefaultCurrency = useCallback(async (currency: DefaultCurrency) => {
    setLocalCurrency(currency);
    CurrencyEventEmitter.emitCurrencyChanged(currency.currencyId);

    if (appInfo && setAppInfo) {
      const updatedAppInfo = {
        ...appInfo,
        currency_code: currency.currencyId,
      };
      setAppInfo(updatedAppInfo);

      try {
        await StorageService.setItem(StorageKey.appInfo, JSON.stringify(updatedAppInfo));
      } catch (err) {
        console.warn('[useDefaultCurrency] Failed to save updated appInfo:', err);
      }
    }
  }, [appInfo, setAppInfo]);

  return {
    defaultCurrency: localCurrency,
    loading,
    updateDefaultCurrency,
  };
};