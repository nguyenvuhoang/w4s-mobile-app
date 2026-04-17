// src/hooks/useCurrencyConverter.ts

import { useCurrency } from "@/hooks/useCurrency";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import {
  Currency,
  currencyRepository,
} from "@/services/repositories/currency.repository";
import {
  detectLocale,
  detectSymbolPosition,
  getDecimalPlaces,
} from "@/utils/currencyLocaleDetector";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Hook để chuyển đổi tiền tệ từ VND (server response) sang đơn vị mặc định của user
 * Tự động update khi user thay đổi default currency
 */
export const useCurrencyConverter = () => {
  const { defaultCurrency, loading: currencyLoading } = useDefaultCurrency();
  const { currencies, loading: currenciesLoading } = useCurrency({
    autoFetch: true,
  });
  const { convert, loading: ratesLoading, rates } = useExchangeRate();

  const [additionalCurrency, setAdditionalCurrency] = useState<Currency | null>(
    null,
  );
  const [loadingAdditional, setLoadingAdditional] = useState(false);

  // Counter để track renders
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  // LOG: Hook render
  console.log(`[useCurrencyConverter] 🔄 Render #${renderCountRef.current}`, {
    defaultCurrencyId: defaultCurrency.currencyId,
    currencyLoading,
    currenciesLoading,
    loadingAdditional,
    currenciesCount: currencies.length,
  });

  // Reset additional currency khi default currency thay đổi
  useEffect(() => {
    console.log("[useCurrencyConverter] 🔔 Default currency CHANGED:", {
      newCurrency: defaultCurrency.currencyId,
      symbol: defaultCurrency.symbol,
      name: defaultCurrency.name,
    });
    setAdditionalCurrency(null);
  }, [defaultCurrency.currencyId]);

  // Combine currencies từ useCurrency + additional currency nếu cần
  const allCurrencies = useMemo(() => {
    if (
      additionalCurrency &&
      !currencies.find((c) => c.currency_id === additionalCurrency.currency_id)
    ) {
      console.log(
        "[useCurrencyConverter] Adding additional currency:",
        additionalCurrency.currency_id,
      );
      return [...currencies, additionalCurrency];
    }
    return currencies;
  }, [currencies, additionalCurrency]);

  // Tạo map để tra cứu currency nhanh
  const currencyMap = useMemo(() => {
    const map = new Map();
    allCurrencies.forEach((currency) => {
      map.set(currency.currency_id, currency);
    });

    console.log("[useCurrencyConverter] Currency map updated:", {
      size: map.size,
      hasDefaultCurrency: map.has(defaultCurrency.currencyId),
      defaultCurrencyId: defaultCurrency.currencyId,
    });

    return map;
  }, [allCurrencies, defaultCurrency.currencyId]);

  // Fetch default currency nếu không có trong list
  useEffect(() => {
    const fetchDefaultCurrency = async () => {
      // Skip nếu đang loading
      if (currenciesLoading || loadingAdditional) {
        console.log("[useCurrencyConverter] Skip fetch (loading):", {
          currenciesLoading,
          loadingAdditional,
        });
        return;
      }

      // QUAN TRỌNG: VND là base currency, không cần fetch
      if (
        defaultCurrency.currencyId === "VND" ||
        defaultCurrency.currencyId === "VNĐ"
      ) {
        const hasVND = allCurrencies.some(
          (c) => c.currency_id === "VND" || c.currency_id === "VNĐ",
        );

        if (!hasVND && allCurrencies.length > 0) {
          console.log(
            "[useCurrencyConverter] VND not found, creating mock VND",
          );

          const mockVND: Currency = {
            currency_id: "VND",
            short_currency_id: "VND",
            currency_name: "Vietnamese Dong",
            currency_number: 704,
            status_of_currency: "active",
            display_order: 0,
            symbol: "₫",
          };

          setAdditionalCurrency(mockVND);
          return;
        }

        console.log("[useCurrencyConverter] VND check done:", {
          hasVND,
          currenciesLength: allCurrencies.length,
        });
        return;
      }

      // Skip nếu chưa có currencies từ API
      if (allCurrencies.length === 0) {
        console.log("[useCurrencyConverter] Skip fetch (no currencies yet)");
        return;
      }

      // Check xem default currency có trong list không
      const hasDefaultCurrency = allCurrencies.some(
        (c) => c.currency_id === defaultCurrency.currencyId,
      );

      if (!hasDefaultCurrency) {
        console.log(
          "[useCurrencyConverter] 📥 Fetching missing currency:",
          defaultCurrency.currencyId,
        );

        try {
          setLoadingAdditional(true);

          const response = await currencyRepository.getCurrencies({
            search_text: defaultCurrency.currencyId,
            page_index: 0,
            page_size: 1,
          });

          if (response.isSuccess() && response.data?.items?.length > 0) {
            const currency = response.data.items[0];
            console.log("[useCurrencyConverter] ✅ Fetched currency:", {
              currency_id: currency.currency_id,
              symbol: currency.symbol,
            });
            setAdditionalCurrency(currency);
          } else {
            console.warn(
              "[useCurrencyConverter] ❌ Could not fetch:",
              defaultCurrency.currencyId,
            );
          }
        } catch (error) {
          console.error("[useCurrencyConverter] Error fetching:", error);
        } finally {
          setLoadingAdditional(false);
        }
      } else {
        console.log(
          "[useCurrencyConverter] Currency already in list:",
          defaultCurrency.currencyId,
        );
      }
    };

    fetchDefaultCurrency();
  }, [
    defaultCurrency.currencyId,
    allCurrencies.length,
    currenciesLoading,
    loadingAdditional,
  ]);

  // Lấy Currency object đầy đủ của default currency
  const targetCurrencyObject = useMemo(() => {
    let found = currencyMap.get(defaultCurrency.currencyId);

    if (!found && defaultCurrency.currencyId === "VND") {
      found = currencyMap.get("VNĐ");
    }

    if (!found && defaultCurrency.currencyId === "VNĐ") {
      found = currencyMap.get("VND");
    }

    console.log("[useCurrencyConverter] Target currency lookup:", {
      lookingFor: defaultCurrency.currencyId,
      found: found ? "YES" : "NO",
      foundData: found
        ? { currency_id: found.currency_id, symbol: found.symbol }
        : null,
    });

    return found;
  }, [currencyMap, defaultCurrency.currencyId]);

  // Tạo formatter info cho default currency
  const currencyFormatter = useMemo(() => {
    if (!targetCurrencyObject) {
      console.log(
        "[useCurrencyConverter] Using fallback formatter for:",
        defaultCurrency.currencyId,
      );

      return {
        locale:
          defaultCurrency.currencyId === "VND" ||
          defaultCurrency.currencyId === "VNĐ"
            ? "vi-VN"
            : "en-US",
        symbolPosition: "after" as const,
        decimalPlaces:
          defaultCurrency.currencyId === "VND" ||
          defaultCurrency.currencyId === "VNĐ"
            ? 0
            : 2,
        symbol: defaultCurrency.symbol || "đ",
        currencyId: defaultCurrency.currencyId || "VND",
      };
    }

    const formatter = {
      locale: detectLocale(targetCurrencyObject),
      symbolPosition: detectSymbolPosition(targetCurrencyObject.currency_id),
      decimalPlaces: getDecimalPlaces(targetCurrencyObject.currency_id),
      symbol: targetCurrencyObject.symbol,
      currencyId: targetCurrencyObject.currency_id,
    };

    console.log("[useCurrencyConverter] Formatter created:", {
      currencyId: formatter.currencyId,
      locale: formatter.locale,
      symbol: formatter.symbol,
      symbolPosition: formatter.symbolPosition,
      decimalPlaces: formatter.decimalPlaces,
    });

    return formatter;
  }, [targetCurrencyObject, defaultCurrency]);

  // Check if ready
  const isReady = useMemo(() => {
    const isVND =
      defaultCurrency.currencyId === "VND" ||
      defaultCurrency.currencyId === "VNĐ";

    if (isVND) {
      const ready = !currencyLoading && !currenciesLoading && !ratesLoading;

      console.log("[useCurrencyConverter] ✓ isReady check (VND):", {
        currencyLoading,
        currenciesLoading,
        ratesLoading,
        result: ready,
      });

      return ready;
    }

    const ready =
      !currencyLoading &&
      !currenciesLoading &&
      !loadingAdditional &&
      !ratesLoading &&
      allCurrencies.length > 0 &&
      rates.length > 0 &&
      !!targetCurrencyObject;

    console.log("[useCurrencyConverter] ✓ isReady check:", {
      currencyLoading,
      currenciesLoading,
      loadingAdditional,
      ratesLoading,
      ratesCount: rates.length,
      currenciesLength: allCurrencies.length,
      hasTargetCurrencyObject: !!targetCurrencyObject,
      defaultCurrencyId: defaultCurrency.currencyId,
      result: ready,
    });

    return ready;
  }, [
    currencyLoading,
    currenciesLoading,
    loadingAdditional,
    ratesLoading,
    rates.length,
    allCurrencies.length,
    targetCurrencyObject,
    defaultCurrency.currencyId,
  ]);

  // LOG when isReady changes
  useEffect(() => {
    if (isReady) {
      console.log("[useCurrencyConverter] ✅ READY!", {
        defaultCurrency: defaultCurrency.currencyId,
        symbol: currencyFormatter.symbol,
        locale: currencyFormatter.locale,
      });
    } else {
      console.log("[useCurrencyConverter] ⏳ NOT READY...", {
        defaultCurrency: defaultCurrency.currencyId,
      });
    }
  }, [isReady, defaultCurrency.currencyId]);

  /**
   * Chuyển đổi từ VND sang default currency
   */
  const convertFromVND = useCallback(
    (amountInVND: number): number => {
      if (
        defaultCurrency.currencyId === "VND" ||
        defaultCurrency.currencyId === "VNĐ"
      ) {
        return amountInVND;
      }

      if (!isReady) {
        console.warn(
          "[useCurrencyConverter] convertFromVND: Not ready, returning original",
          amountInVND,
        );
        return amountInVND;
      }

      const result = convert(amountInVND, "VND", defaultCurrency.currencyId);

      if (result === null) {
        console.warn(
          `[useCurrencyConverter] Conversion failed VND -> ${defaultCurrency.currencyId}`,
        );
        return amountInVND;
      }

      if (
        defaultCurrency.currencyId === "VND" ||
        defaultCurrency.currencyId === "VNĐ"
      ) {
        return Math.round(result);
      }

      return Math.round(result * 100) / 100;
    },
    [defaultCurrency, convert, isReady],
  );

  /**
   * Format số tiền
   */
  const formatAmount = useCallback(
    (amount: number): string => {
      const { locale, symbolPosition, decimalPlaces, symbol } =
        currencyFormatter;

      try {
        const formatter = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: defaultCurrency.currencyId,
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: Math.max(decimalPlaces, amount > 0 && amount < 1 ? 4 : decimalPlaces),
        });

        const result = formatter.format(amount);
        return result;
      } catch (error) {
        console.warn("[useCurrencyConverter] Intl failed, using fallback");

        const formattedNumber = amount.toLocaleString(locale, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: Math.max(decimalPlaces, amount > 0 && amount < 1 ? 4 : decimalPlaces),
        });

        const result =
          symbolPosition === "after"
            ? `${formattedNumber} ${symbol}`
            : `${symbol}${formattedNumber}`;

        return result;
      }
    },
    [defaultCurrency, currencyFormatter],
  );

  /**
   * Convert và format
   */
  const convertAndFormat = useCallback(
    (amountInVND: number): string => {
      const convertedAmount = convertFromVND(amountInVND);
      const formatted = formatAmount(convertedAmount);

      return formatted;
    },
    [convertFromVND, formatAmount, defaultCurrency.currencyId, isReady],
  );

  /**
   * Format percent
   */
  const formatPercent = useCallback((percent: number): string => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  }, []);

  /**
   * Get exchange rate
   */
  const getExchangeRate = useCallback((): number | null => {
    if (
      defaultCurrency.currencyId === "VND" ||
      defaultCurrency.currencyId === "VNĐ"
    ) {
      return 1;
    }

    if (!isReady) {
      return null;
    }

    return convert(1, "VND", defaultCurrency.currencyId);
  }, [defaultCurrency, convert, isReady]);

  /**
   * Convert between currencies
   */
  const convertBetween = useCallback(
    (
      amount: number,
      fromCurrencyId: string,
      toCurrencyId?: string,
    ): number | null => {
      const targetCurrency = toCurrencyId || defaultCurrency.currencyId;

      if (fromCurrencyId === targetCurrency) {
        return amount;
      }

      if (!isReady) {
        return null;
      }

      return convert(amount, fromCurrencyId, targetCurrency);
    },
    [defaultCurrency, convert, isReady],
  );

  return {
    defaultCurrency,
    targetCurrencyObject,
    currencyFormatter,
    currencies: allCurrencies,
    loading: currencyLoading || currenciesLoading || loadingAdditional || ratesLoading,
    isReady,
    convertFromVND,
    formatAmount,
    convertAndFormat,
    formatPercent,
    getExchangeRate,
    convertBetween,
  };
};
