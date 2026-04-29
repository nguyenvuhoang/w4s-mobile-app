// src/hooks/useCurrencyPicker.ts
//
// Shared hook for currency selection + conversion display.
// Encapsulates:
//  - inputCurrency state (initialised from defaultCurrency)
//  - useFocusEffect to pick up selection from /(protected)/select-currency
//  - Sync with defaultCurrency when user hasn't manually chosen
//
// Conversion logic:
//  - needsConversion = inputCurrency !== defaultCurrency
//    (only show conversion when user picks a FOREIGN currency)
//  - baseCurrency = the target currency to convert INTO
//    (defaults to defaultCurrency if not provided)
//   const {
//     inputCurrency,
//     onCurrencyPress,
//     needsConversion,
//     exchangeRate,
//     convertedAmount,
//   } = useCurrencyPicker({ baseCurrency: defaultCurrency, amount: '1,000' });

import STORAGE_KEY from "@/constants/StorageKey";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import StorageService from "@/services/StorageService";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface CurrencyInfo {
  currencyId: string;
  symbol: string;
  name?: string;
}

interface UseCurrencyPickerOptions {
  /**
   * The "base" currency to compare against for conversion display.
   * - In transaction screens this is the wallet currency.
   * - In paybook screens this is typically the default app currency.
   * Omit to use the app default currency automatically.
   */
  baseCurrency?: CurrencyInfo;
  /**
   * The current raw amount string (with commas), used to compute convertedAmount.
   */
  amount?: string;
  /**
  /**
   * When true the currency picker navigation is disabled (e.g. Edit screens
   * where the API does not support changing currency).
   */
  disabled?: boolean;
  /**
   * Optional initial currency to use instead of app default.
   */
  initialCurrency?: CurrencyInfo;
}

interface UseCurrencyPickerResult {
  /** Currently selected input currency */
  inputCurrency: CurrencyInfo;
  /** Setter for inputCurrency */
  setInputCurrency: (currency: CurrencyInfo) => void;
  /** Call to navigate to the select-currency screen */
  onCurrencyPress: () => void;
  /** true when inputCurrency ≠ defaultCurrency (user picked a foreign currency) */
  needsConversion: boolean;
  /**
   * 1 inputCurrency → X baseCurrency
   * null when conversion is not available
   */
  exchangeRate: number | null;
  /**
   * `amount` converted to baseCurrency
   * null when no conversion needed or rate unavailable
   */
  convertedAmount: number | null;
  /** The target currency used for conversion display (usually the wallet currency) */
  walletCurrency: CurrencyInfo;
}

export const useCurrencyPicker = (
  options: UseCurrencyPickerOptions = {}
): UseCurrencyPickerResult => {
  const { amount = "0", disabled = false, initialCurrency } = options;
  const { defaultCurrency } = useDefaultCurrency();
  const { convert } = useExchangeRate();

  const baseCurrency: CurrencyInfo = options.baseCurrency ?? {
    currencyId: defaultCurrency.currencyId,
    symbol: defaultCurrency.symbol,
    name: defaultCurrency.name,
  };

  const hasManuallySelectedRef = useRef(!!initialCurrency);

  const [inputCurrency, setInputCurrency] = useState<CurrencyInfo>(
    initialCurrency ?? {
      currencyId: defaultCurrency.currencyId,
      symbol: defaultCurrency.symbol,
      name: defaultCurrency.name,
    }
  );

  // ── Sync with defaultCurrency when user hasn't manually chosen ──────────────
  // Depend on both currencyId AND symbol: useDefaultCurrency initializes with
  // symbol "₫" always, then resolveCurrency() updates the correct symbol later.
  useEffect(() => {
    if (!hasManuallySelectedRef.current) {
      setInputCurrency({
        currencyId: defaultCurrency.currencyId,
        symbol: defaultCurrency.symbol,
        name: defaultCurrency.name,
      });
    }
  }, [defaultCurrency.currencyId, defaultCurrency.symbol]);

  // Handle updates to initialCurrency from parent
  useEffect(() => {
    if (initialCurrency) {
      setInputCurrency(initialCurrency);
      hasManuallySelectedRef.current = true;
    }
  }, [initialCurrency?.currencyId, initialCurrency?.symbol]);

  // ── Pick up selection from /(protected)/select-currency ─────────────────────
  useFocusEffect(
    useCallback(() => {
      if (disabled) return;
      const load = async () => {
        try {
          const stored = await StorageService.getItem(
            STORAGE_KEY.TEMP_CURRENCY_STORAGE
          );
          if (!stored) return;
          const currency: CurrencyInfo = JSON.parse(stored);
          setInputCurrency(currency);
          hasManuallySelectedRef.current = true;
          await StorageService.removeItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
        } catch (err) {
          console.error("[useCurrencyPicker] Failed to load currency:", err);
        }
      };
      load();
    }, [disabled])
  );

  // ── Navigation helper ────────────────────────────────────────────────────────
  const onCurrencyPress = useCallback(() => {
    if (disabled) return;
    hasManuallySelectedRef.current = true;
    router.push("/(protected)/select-currency");
  }, [disabled]);

  // ── Conversion computations ──────────────────────────────────────────────────
  // needsConversion: trigger khi inputCurrency khác defaultCurrency
  // (dù baseCurrency có thể là walletCurrency hay bất kỳ target nào khác)
  const needsConversion = useMemo(
    () => inputCurrency.currencyId !== defaultCurrency.currencyId,
    [inputCurrency.currencyId, defaultCurrency.currencyId]
  );

  // baseCurrency = mục tiêu convert (mặc định là defaultCurrency nếu không truyền vào)
  const targetCurrency = baseCurrency;

  const exchangeRate = useMemo<number | null>(() => {
    if (!needsConversion) return null;
    const rate = convert(1, inputCurrency.currencyId, targetCurrency.currencyId);
    if (rate === null) return null;
    const isVND =
      targetCurrency.currencyId === "VND" || targetCurrency.currencyId === "VNĐ";
    return isVND ? Math.round(rate) : Math.round(rate * 10000) / 10000;
  }, [needsConversion, inputCurrency.currencyId, targetCurrency.currencyId, convert]);

  const convertedAmount = useMemo<number | null>(() => {
    if (!needsConversion || !amount || amount === "0") return null;
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount)) return null;
    const result = convert(numAmount, inputCurrency.currencyId, targetCurrency.currencyId);
    if (result === null) return null;
    const isVND =
      targetCurrency.currencyId === "VND" || targetCurrency.currencyId === "VNĐ";
    return isVND ? Math.round(result) : Math.round(result * 100) / 100;
  }, [needsConversion, amount, inputCurrency.currencyId, targetCurrency.currencyId, convert]);

  return {
    inputCurrency,
    setInputCurrency,
    onCurrencyPress,
    needsConversion,
    exchangeRate,
    convertedAmount,
    walletCurrency: targetCurrency,
  };
};
